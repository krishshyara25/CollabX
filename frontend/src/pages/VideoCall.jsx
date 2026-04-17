import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import Peer from 'simple-peer';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Video, Mic, MicOff, VideoOff, MonitorUp, PhoneOff, Circle, Square, Users, CheckSquare, Square as Unchecker } from 'lucide-react';

const VideoCall = () => {
    const { id: roomId } = useParams();
    const { user } = useAuth();
    const socket = useSocket();
    const navigate = useNavigate();
    const location = useLocation();

    // Lobby State
    const [isLobby, setIsLobby] = useState(true);
    const [roomMembers, setRoomMembers] = useState([]);
    const [selectedMembers, setSelectedMembers] = useState([]);

    // WebRTC connection state
    const [peers, setPeers] = useState([]);
    const [stream, setStream] = useState(null);
    const [screenStream, setScreenStream] = useState(null);
    const [isScreenSharing, setIsScreenSharing] = useState(false);
    
    // Media controls
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    
    // Recording controls
    const [isRecording, setIsRecording] = useState(false);
    const mediaRecorderRef = useRef(null);
    const recordedChunksRef = useRef([]);

    const userVideo = useRef();
    const peersRef = useRef([]);

    // 1. Fetch Room Members for Lobby Room & handle autoJoin flag
    useEffect(() => {
        const queryParams = new URLSearchParams(location.search);
        if (queryParams.get('autoJoin') === 'true') {
            setIsLobby(false); // Skip lobby if auto-joining
        }

        const fetchMembers = async () => {
            try {
                const token = localStorage.getItem('token');
                const { data } = await axios.get(`http://localhost:5000/api/rooms/${roomId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                
                if (data && data.participants) {
                    // Filter out the current user so they don't call themselves
                    const others = data.participants.filter(p => p.username !== user.username);
                    
                    // If creator is not in participants list, add them (schema dependent, robust check)
                    if (data.creator && data.creator.username !== user.username && !others.find(o => o.username === data.creator.username)) {
                        others.unshift(data.creator);
                    }
                    setRoomMembers(others);
                }
            } catch (err) {
                console.error('Failed to fetch members for lobby', err);
            }
        };

        if (isLobby) {
            fetchMembers();
            if (socket) {
                // Ensure they are strictly in the room
                socket.emit('join_room', { roomId, username: user?.username });
                
                socket.on('incoming_video_call', ({ callerName, targetUsers }) => {
                    if (targetUsers.includes(user.username)) {
                        toast.info(
                            <div>
                                <p style={{ margin: 0, fontWeight: 600 }}>📡 {callerName} invited you to a Video Call!</p>
                                <button 
                                    onClick={() => { setIsLobby(false); toast.dismiss(); }}
                                    style={{ marginTop: '10px', background: '#3b82f6', color: 'white', padding: '0.4rem 0.8rem', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', width: '100%' }}
                                >
                                    Join Call
                                </button>
                            </div>,
                            { autoClose: 20000, position: 'top-center', closeOnClick: false }
                        );
                    }
                });
            }
        }

        return () => {
            if (socket && isLobby) {
                socket.off('incoming_video_call');
            }
        };
    }, [location.search, roomId, user.username, isLobby, socket]);


    // 2. Init WebRTC only if we passed the Lobby (isLobby === false)
    useEffect(() => {
        if (isLobby || !socket) return;

        navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then(currentStream => {
            setStream(currentStream);
            if (userVideo.current) {
                userVideo.current.srcObject = currentStream;
            }

            socket.emit('join_video', roomId);

            socket.on('user_connected_video', userId => {
                const peer = createPeer(userId, socket.id, currentStream);
                peersRef.current.push({
                    peerID: userId,
                    peer,
                });
                setPeers(prev => [...prev, { peerID: userId, peer }]);
            });

            socket.on('webrtc_offer_receive', payload => {
                const peer = addPeer(payload.signal, payload.callerID, currentStream);
                peersRef.current.push({
                    peerID: payload.callerID,
                    peer,
                });
                setPeers(prev => [...prev, { peerID: payload.callerID, peer }]);
            });

            socket.on('webrtc_answer_receive', payload => {
                const item = peersRef.current.find(p => p.peerID === payload.id);
                if (item && item.peer) {
                    item.peer.signal(payload.signal);
                }
            });

            socket.on('user_disconnected_video', userId => {
                const peerObj = peersRef.current.find(p => p.peerID === userId);
                if (peerObj) peerObj.peer.destroy();
                peersRef.current = peersRef.current.filter(p => p.peerID !== userId);
                setPeers(prev => prev.filter(p => p.peerID !== userId));
            });
        }).catch(err => {
            console.error("Media access denied:", err);
            alert('Camera/Microphone access was denied. You can only spectate.');
            // Implement listener-only dummy peer if needed
        });

        // Cleanup WebRTC connections when unmounting
        return () => {
            if (socket) {
                socket.off('user_connected_video');
                socket.off('webrtc_offer_receive');
                socket.off('webrtc_answer_receive');
                socket.off('user_disconnected_video');
                socket.emit('disconnect_from_room', { roomId, username: user?.username });
            }
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
            if (screenStream) {
                screenStream.getTracks().forEach(track => track.stop());
            }
            peersRef.current.forEach(({peer}) => peer.destroy());
        };
    }, [isLobby, socket, roomId]);


    // Helper functions for Peers
    function createPeer(userToSignal, callerID, stream) {
        const peer = new Peer({ initiator: true, trickle: false, stream });
        peer.on('signal', signal => {
            socket.emit('webrtc_offer', { userToSignal, callerID, signal });
        });
        return peer;
    }

    function addPeer(incomingSignal, callerID, stream) {
        const peer = new Peer({ initiator: false, trickle: false, stream });
        peer.on('signal', signal => {
            socket.emit('webrtc_answer', { signal, callerID });
        });
        peer.signal(incomingSignal);
        return peer;
    }

    // Toggle Handlers
    const toggleMute = () => {
        if (stream) {
            const track = stream.getAudioTracks()[0];
            if (track) {
                track.enabled = !track.enabled;
                setIsMuted(!track.enabled);
            }
        }
    };

    const toggleVideo = () => {
        if (stream) {
            const track = stream.getVideoTracks()[0];
            if (track) {
                track.enabled = !track.enabled;
                setIsVideoOff(!track.enabled);
            }
        }
    };

    const toggleScreenShare = async () => {
        if (!isScreenSharing) {
            try {
                const displayStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
                setScreenStream(displayStream);
                setIsScreenSharing(true);

                if (userVideo.current) userVideo.current.srcObject = displayStream;

                const videoTrack = displayStream.getVideoTracks()[0];
                peersRef.current.forEach(({ peer }) => {
                    const oldVideoTrack = stream.getVideoTracks()[0];
                    if (oldVideoTrack) peer.replaceTrack(oldVideoTrack, videoTrack, stream);
                });

                videoTrack.onended = () => stopScreenShare();
            } catch (err) {
                console.error("Screen Share Failed:", err);
            }
        } else {
            stopScreenShare();
        }
    };

    const stopScreenShare = () => {
        setIsScreenSharing(false);
        if (screenStream) {
            screenStream.getTracks().forEach(track => track.stop());
            setScreenStream(null);
        }
        if (userVideo.current && stream) userVideo.current.srcObject = stream;
        
        const videoTrack = stream?.getVideoTracks()[0];
        if (videoTrack) {
            peersRef.current.forEach(({ peer }) => {
                const currentTrack = peer.streams[0]?.getVideoTracks()[0];
                if (currentTrack) peer.replaceTrack(currentTrack, videoTrack, stream);
            });
        }
    };

    const startRecording = async () => {
        try {
            const displayStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
            recordedChunksRef.current = [];
            const mediaRecorder = new MediaRecorder(displayStream, { mimeType: 'video/webm' });
            mediaRecorderRef.current = mediaRecorder;

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) recordedChunksRef.current.push(event.data);
            };

            mediaRecorder.onstop = () => {
                const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = url;
                a.download = `collaborative_study_${new Date().toISOString()}.webm`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                setIsRecording(false);
                displayStream.getTracks().forEach(t => t.stop());
            };

            mediaRecorder.start();
            setIsRecording(true);
            
            displayStream.getVideoTracks()[0].onended = () => {
                if (mediaRecorder.state !== 'inactive') mediaRecorder.stop();
            };
        } catch (err) {
             console.error("Recording failed", err);
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
        }
    };


    const leaveCall = () => {
        navigate(`/room/${roomId}`);
    };


    // Action for Lobby Menu: "Add Members and Make Call"
    const handleStartCall = () => {
        // Broadcast incoming call invite to selected target users only
        if (selectedMembers.length > 0 && socket) {
            socket.emit('start_video_call', { 
                roomId, 
                callerName: user.username, 
                targetUsers: selectedMembers 
            });
        }
        // Enter the WebRTC Room
        setIsLobby(false);
    };

    const toggleMemberSelection = (username) => {
        setSelectedMembers(prev => 
            prev.includes(username) 
                ? prev.filter(u => u !== username) 
                : [...prev, username]
        );
    };

    // ---------------- LOBBY UI ----------------
    if (isLobby) {
        return (
            <div style={{ padding: '4rem', display: 'flex', justifyContent: 'center', height: '100vh', background: '#f8fafc', fontFamily: 'Inter' }}>
                <div style={{ background: 'white', padding: '2.5rem', borderRadius: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.06)', maxWidth: '500px', width: '100%', height: 'fit-content' }}>
                    
                    <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                        <div style={{ background: '#eff6ff', display: 'inline-flex', padding: '1rem', borderRadius: '50%', marginBottom: '1rem' }}>
                            <Video size={40} color="#3b82f6" />
                        </div>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>Prepare Video Call</h2>
                        <p style={{ color: '#64748b', fontSize: '0.95rem' }}>Select the members you want to invite to your private call room.</p>
                    </div>

                    <div style={{ marginBottom: '2rem' }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#0f172a', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Users size={18} /> Room Members
                        </h3>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '250px', overflowY: 'auto', paddingRight: '0.5rem' }}>
                            {roomMembers.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8', fontSize: '0.9rem', border: '2px dashed #e2e8f0', borderRadius: '12px' }}>
                                    No other members inside this room yet.
                                </div>
                            ) : (
                                roomMembers.map(member => (
                                    <div 
                                        key={member._id}
                                        onClick={() => toggleMemberSelection(member.username)}
                                        style={{ 
                                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                            padding: '0.8rem 1.25rem', border: `1.5px solid ${selectedMembers.includes(member.username) ? '#3b82f6' : '#e2e8f0'}`, 
                                            borderRadius: '12px', cursor: 'pointer', transition: 'all 0.2s',
                                            background: selectedMembers.includes(member.username) ? '#eff6ff' : 'white'
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <div style={{ background: '#3b82f6', color: 'white', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                                                {member.username[0].toUpperCase()}
                                            </div>
                                            <span style={{ fontWeight: 600, color: '#0f172a' }}>{member.username}</span>
                                        </div>
                                        
                                        {selectedMembers.includes(member.username) ? <CheckSquare color="#3b82f6" /> : <Unchecker color="#cbd5e1" />}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button 
                            onClick={() => navigate(`/room/${roomId}`)}
                            style={{ flex: 1, padding: '1rem', borderRadius: '12px', fontWeight: 600, border: '1.5px solid #e2e8f0', background: 'white', color: '#64748b', cursor: 'pointer' }}
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={handleStartCall}
                            style={{ flex: 2, padding: '1rem', borderRadius: '12px', fontWeight: 700, border: 'none', background: '#3b82f6', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', boxShadow: '0 8px 16px rgba(59,130,246,0.25)' }}
                        >
                            <Video size={18} /> {selectedMembers.length > 0 ? `Invite ${selectedMembers.length} Members & Start` : 'Join Call Alone'}
                        </button>
                    </div>

                </div>
            </div>
        )
    }

    // ---------------- ACTIVE VIDEO UI ----------------
    return (
        <div style={{ padding: '2rem 3rem', height: '100vh', display: 'flex', flexDirection: 'column', background: '#0f172a' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifySelf: 'start', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', color: 'white' }}>
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 700 }}>
                    <Video style={{ color: '#3b82f6' }} /> Video Conference Room
                </h2>
                {isRecording && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444', fontWeight: 600, animation: 'pulse 1.5s infinite' }}>
                        <Circle fill="#ef4444" size={14} /> Recording Active
                    </div>
                )}
            </div>

            {/* Video Grid */}
            <div style={{ 
                flex: 1, 
                display: 'grid', 
                gridTemplateColumns: peers.length > 0 ? 'repeat(auto-fit, minmax(300px, 1fr))' : '1fr', 
                gap: '1rem', 
                overflowY: 'auto',
                paddingBottom: '2rem'
            }}>
                {/* Local Video */}
                <div style={{ position: 'relative', borderRadius: '16px', overflow: 'hidden', background: '#1e293b', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
                    <video 
                        muted 
                        ref={userVideo} 
                        autoPlay 
                        playsInline 
                        style={{ width: '100%', height: '100%', objectFit: 'cover', transform: isScreenSharing ? 'none' : 'scaleX(-1)' }} 
                    />
                    <div style={{ position: 'absolute', bottom: '1rem', left: '1rem', background: 'rgba(0,0,0,0.6)', padding: '0.4rem 0.8rem', borderRadius: '8px', color: 'white', fontWeight: 600, fontSize: '0.9rem', backdropFilter: 'blur(4px)' }}>
                        You {isScreenSharing ? '(Presenting)' : ''}
                    </div>
                </div>

                {/* Remote Videos */}
                {peers.map((peerObj, index) => {
                    return (
                        <div key={index} style={{ position: 'relative', borderRadius: '16px', overflow: 'hidden', background: '#1e293b', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
                            <PeerVideo peer={peerObj.peer} />
                            <div style={{ position: 'absolute', bottom: '1rem', left: '1rem', background: 'rgba(0,0,0,0.6)', padding: '0.4rem 0.8rem', borderRadius: '8px', color: 'white', fontWeight: 600, fontSize: '0.9rem', backdropFilter: 'blur(4px)' }}>
                                Connected Peer
                            </div>
                        </div>
                    );
                })}

                {/* Empty State when waiting for others */}
                {peers.length === 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '2px dashed rgba(255,255,255,0.1)', color: '#94a3b8' }}>
                         <Users size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                         <p>Waiting for others to join...</p>
                    </div>
                )}
            </div>

            {/* Controls Bar */}
            <div style={{ 
                background: 'rgba(30,41,59,0.8)', backdropFilter: 'blur(16px)', 
                padding: '1.25rem', borderRadius: '24px', 
                display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem',
                border: '1px solid rgba(255,255,255,0.1)',
                marginTop: 'auto'
            }}>
                <ControlButton active={isMuted} onClick={toggleMute} icon={isMuted ? <MicOff /> : <Mic />} color={isMuted ? '#ef4444' : '#f8fafc'} label="Mute" />
                <ControlButton active={isVideoOff} onClick={toggleVideo} icon={isVideoOff ? <VideoOff /> : <Video />} color={isVideoOff ? '#ef4444' : '#f8fafc'} label="Video" />
                
                <div style={{ width: '1px', height: '40px', background: 'rgba(255,255,255,0.1)', margin: '0 0.5rem' }}></div>
                
                <ControlButton active={isScreenSharing} onClick={toggleScreenShare} icon={<MonitorUp />} color={isScreenSharing ? '#3b82f6' : '#f8fafc'} label="Share Screen" />
                
                {isRecording ? (
                    <ControlButton active={true} onClick={stopRecording} icon={<Square fill="currentColor" />} color="#ef4444" label="Stop record" />
                ) : (
                    <ControlButton active={false} onClick={startRecording} icon={<Circle />} color="#f8fafc" label="Record call" />
                )}

                <div style={{ width: '1px', height: '40px', background: 'rgba(255,255,255,0.1)', margin: '0 0.5rem' }}></div>
                
                <button 
                    onClick={leaveCall}
                    style={{ 
                        background: '#ef4444', color: 'white', border: 'none', 
                        padding: '1rem 2rem', borderRadius: '16px', fontWeight: 700, 
                        display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer',
                        boxShadow: '0 8px 16px rgba(239,68,68,0.3)', transition: 'all 0.2s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                >
                    <PhoneOff size={20} /> Leave Call
                </button>
            </div>
        </div>
    );
};

// Subcomponents
const ControlButton = ({ icon, onClick, active, color, label }) => (
    <button 
        onClick={onClick}
        title={label}
        style={{
            width: '56px', height: '56px', borderRadius: '16px', cursor: 'pointer',
            background: active ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.05)',
            border: `1px solid ${active ? color : 'rgba(255,255,255,0.1)'}`,
            color: color,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.2s',
        }}
        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
        onMouseLeave={e => e.currentTarget.style.background = active ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.05)'}
    >
        {React.cloneElement(icon, { size: 24 })}
    </button>
);

const PeerVideo = ({ peer }) => {
    const ref = useRef();

    useEffect(() => {
        peer.on("stream", stream => {
            if (ref.current) ref.current.srcObject = stream;
        });
    }, [peer]);

    return <video playsInline autoPlay ref={ref} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />;
};

export default VideoCall;
