const clientId = "8a46cae383774efa95cab3996c13f1aa";
const redirectUri = "https://dhyankannoth.github.io/Spotify-Playlist-Backup/";
const scopes = "playlist-read-private playlist-read-collaborative";

document.getElementById("login-btn").addEventListener("click", () => {
    const authUrl = `https://accounts.spotify.com/authorize?client_id=${clientId}&response_type=token&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scopes)}`;
    window.location.href = authUrl;
});

const hash = window.location.hash.substring(1).split("&").reduce((acc, item) => {
    let parts = item.split("=");
    acc[parts[0]] = decodeURIComponent(parts[1]);
    return acc;
},{});

const accessToken = hash.access_token;

async function fetchPlaylists(playlistId){
    const response = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}`,{
        headers: {Authorization: "Bearer "+ accessToken }
    });
    const data = await response.json();
    displayPlaylists(data.tracks.items);
}

function displayPlaylists(tracks){
    const container = document.getElementById("playlist-container");
    container.innerHTML = "";
    tracks.forEach(item => {
        const track = item.track;
        const div = document.createElement("div");
        div.classList.add("track");
        div.innerHTML = `
            <h4>${track.name}</h4>
            <p>${track.artists.map(a => a.name).join(", ")} - ${track.album.name}</p>
        `;
        container.appendChild(div);
    });
    document.getElementById("download-btn").style.display = "block";
}

function getPlaylistId(input){
    try {
        const url = new URL(input);
        const parts = url.pathname.split('/');
        if(parts[1] === "playlist") return parts[2];
    } catch(e){
        return input;
    }
    return input;
}

document.getElementById("fetch-btn").addEventListener("click", async () => {
    const input = document.getElementById("playlist-id").value.trim();
    const playlistId = getPlaylistId(input);
    if(!playlistId) return;
    await fetchPlaylists(playlistId);
});

document.getElementById("download-btn").addEventListener("click", async() => {
    const input = document.getElementById("playlist-id").value.trim();
    const playlistId = getPlaylistId(input);
    const response = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}`,{
        headers: { Authorization: "Bearer " + accessToken }
    });
    const data = await response.json();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "spotify_playlist_backup.json";
    a.click();
});

if(accessToken) {}
const toggleBtn = document.getElementById("theme-toggle");
    const body = document.body;
    let themeIndex = 0;

    toggleBtn.addEventListener("click", () => {
      themeIndex = (themeIndex + 1) % 3;
      body.className = ""; 
      if (themeIndex === 1) body.classList.add("theme-red-yellow");
      else if (themeIndex === 2) body.classList.add("theme-pink-purple");
    });






