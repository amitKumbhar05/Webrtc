const socket = io();

const peer = new RTCPeerConnection({
  iceServers: [
    {
      urls: "stun:stun.stunprotocol.org"
    }
  ]
});

peer.onicecandidate = (event) => {
  if (event.candidate) {
    socket.emit('candidate', event.candidate);
  }
};

peer.oniceconnectionstatechange = () => {
  const connectionState = peer.iceConnectionState;
  console.log('ICE Connection State:', connectionState);
  const status = document.getElementById('sstatus');

  switch (connectionState) {
    case 'new':
      status.innerText = 'New connection';
      break;
    case 'checking':
      status.innerText = 'Checking connection';
      break;
    case 'connected':
      status.innerText = 'Connection established';
      break;
    case 'completed':
      status.innerText = 'Connection completed';
      break;
    case 'failed':
      status.innerText = 'Connection failed';
      break;
    case 'disconnected':
      status.innerText = 'Connection disconnected';
      break;
    case 'closed':
      status.innerText = 'Connection closed';
      break;
  }
};

peer.ontrack = (event) => {
  const remoteVideo = document.getElementById('remote-video');
  remoteVideo.srcObject = event.streams[0];
};

navigator.mediaDevices.getUserMedia({ video: true, audio: true })
  .then((stream) => {
    const localVideo = document.getElementById('local-video');
    localVideo.srcObject = stream;
    stream.getTracks().forEach((track) => {
      peer.addTrack(track, stream);
    });
  }).catch((error) => {
    console.error('Error accessing media devices:', error);
  });

socket.on('offer', async (offer) => {
  await peer.setRemoteDescription(new RTCSessionDescription(offer));
  const answer = await peer.createAnswer();
  await peer.setLocalDescription(answer);
  socket.emit('answer', answer);
});

socket.on('answer', async (answer) => {
  await peer.setRemoteDescription(new RTCSessionDescription(answer));
});

socket.on('candidate', async (candidate) => {
  await peer.addIceCandidate(new RTCIceCandidate(candidate));
});

const createOffer = async (id) => {
  const offer = await peer.createOffer();
  await peer.setLocalDescription(offer);
  socket.emit('offer', { offer, to: id });
};

window.addEventListener('load', () => {
  getUserMedia();
  getAndUpdateUsers();
});


const getAndUpdateUsers = async () => {
    const usersDiv = document.getElementById('users');
    const res = await fetch('/users', { method: "GET" });
    const resJson = await res.json();
    resJson.forEach(user => {
      const btn = document.createElement('button');
      const textNode = document.createTextNode(user[0]);
      btn.setAttribute('onclick', `createOffer('${user[0]}')`);
      btn.appendChild(textNode);
      usersDiv.appendChild(btn);
    });
  };
  
  socket.on('user:joined', id => {
    const usersDiv = document.getElementById('users');
    const btn = document.createElement('button');
    const textNode = document.createTextNode(id);
    btn.appendChild(textNode);
    btn.setAttribute('onclick', `createOffer('${id}')`);
    usersDiv.appendChild(btn);
  });
  
  socket.on('user:disconnect', id => {
    const btn = document.getElementById(id);
    if (btn) {
      btn.remove();
    }
  });
  const getUserMedia = async()=>{
    const userMedia = await navigator.mediaDevices.getUserMedia({
        video: true,
    })
    const videoEle = document.getElementById('local-video');
    videoEle.srcObject = userMedia;
    videoEle.play()
  }