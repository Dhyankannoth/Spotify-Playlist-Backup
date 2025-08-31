const clientId = "YOUR_SPOTIFY_CLIENT_ID";
const redirectUri = "https://dhyankannoth.github.io/Spotify-Playlist-Backup/";
const scopes = "playlist-read-private playlist-read-collaborative";

document.getElementById("login-btn").addEventListener("click", () => {
    const authUrl = `https://accounts.spotify.com/authorize?client_id=${clientId}&response_type=token&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scopes)}`;
    window.location.href = authUrl;
});

const hash = window.location.hash.substring(1).split("&").reduce((acc, item) => {
    const parts = item.split("=");
    acc[parts[0]] = decodeURIComponent(parts[1]);
    return acc;
}, {});

let accessToken = hash.access_token;

window.history.replaceState({}, document.title, window.location.pathname);

const loginBtn = document.getElementById("login-btn");
const inputContainer = document.getElementById("input-container");
const playlistContainer = document.getElementById("playlist-container");
const downloadBtn = document.getElementById("download-btn");

if(accessToken) {
    loginBtn.style.display = "none";          
    inputContainer.style.display = "flex";    
}

async function fetchPlaylist(playlistId) {
    if(!accessToken) {
        alert("Session expired. Please log in again.");
        return;
    }

    const response = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}`, {
        headers: { Authorization: "Bearer " + accessToken }
    });

    if(!response.ok) {
        alert("Failed to fetch playlist. Check the ID or log in again.");
        return;
    }

    const data = await response.json();
    displayPlaylist(data.tracks.items);
}

function displayPlaylist(tracks) {
    playlistContainer.innerHTML = "";
    tracks.forEach((t, index) => {
        const trackDiv = document.createElement("div");
        trackDiv.classList.add("track");
        trackDiv.innerHTML = `
            <strong>${index + 1}. ${t.track.name}</strong><br>
            Artist: ${t.track.artists.map(a => a.name).join(", ")}<br>
            Album: ${t.track.album.name}
        `;
        playlistContainer.appendChild(trackDiv);
    });

    downloadBtn.style.display = "inline-block";
}

function downloadCSV(tracks) {
    const rows = ["Track,Artist,Album"];
    tracks.forEach(t => {
        const trackName = t.track.name.replace(/,/g,"");
        const artists = t.track.artists.map(a=>a.name).join(" & ").replace(/,/g,"");
        const album = t.track.album.name.replace(/,/g,"");
        rows.push(`${trackName},${artists},${album}`);
    });
    const blob = new Blob([rows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "spotify_playlist_backup.csv";
    a.click();
}

document.getElementById("fetch-btn").addEventListener("click", () => {
    const playlistId = document.getElementById("playlist-id").value.trim();
    if(!playlistId) { alert("Enter a playlist ID"); return; }
    fetchPlaylist(playlistId);
});

downloadBtn.addEventListener("click", () => {
    const tracks = Array.from(document.querySelectorAll(".track")).map(div => {
        const lines = div.innerText.split("\n");
        return {
            track: {
                name: lines[0].replace(/^\d+\.\s*/, ""),
                artists: [{name: lines[1].replace("Artist: ","")}],
                album: {name: lines[2].replace("Album: ","")}
            }
        };
    });
    downloadCSV(tracks);
});

const toggleBtn = document.getElementById("theme-toggle");
const body = document.body;
let themeIndex = 0;

toggleBtn.addEventListener("click", () => {
    themeIndex = (themeIndex + 1) % 3;
    body.className = "";
    if(themeIndex === 1) body.classList.add("theme-red-yellow");
    else if(themeIndex === 2) body.classList.add("theme-pink-purple");
});


