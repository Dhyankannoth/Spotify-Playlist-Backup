const clientId = "8a46cae383774efa95cab3996c13f1aa"; 
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

const accessToken = hash.access_token;

if(accessToken) {
  document.getElementById("login-btn").style.display = "none";
  document.getElementById("input-container").style.display = "flex";
}

async function fetchPlaylist(playlistId) {
  const resp = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}`, {
    headers: { Authorization: "Bearer " + accessToken }
  });
  if(!resp.ok) { alert("Failed to fetch playlist. Check the ID."); return; }
  const data = await resp.json();
  displayPlaylist(data.tracks.items);
}

function displayPlaylist(tracks) {
  const container = document.getElementById("playlist-container");
  container.innerHTML = "";
  tracks.forEach((t,index) => {
    const trackDiv = document.createElement("div");
    trackDiv.classList.add("track");
    trackDiv.innerHTML = `
      <strong>${index+1}. ${t.track.name}</strong><br>
      Artist: ${t.track.artists.map(a=>a.name).join(", ")}<br>
      Album: ${t.track.album.name}
    `;
    container.appendChild(trackDiv);
  });
  document.getElementById("download-btn").style.display = "inline-block";
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

document.getElementById("download-btn").addEventListener("click", () => {
  const tracks = Array.from(document.querySelectorAll(".track")).map(div => {
    const lines = div.innerText.split("\n");
    return { track: { name: lines[0].replace(/^\d+\.\s*/,""), artists:[{name: lines[1].replace("Artist: ","")}], album:{name: lines[2].replace("Album: ","")} } };
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

