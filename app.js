const clientId = "8a46cae383774efa95cab3996c13f1aa";
const redirectUri = "https://dhyankannoth.github.io/Spotify-Playlist-Backup/";
const scopes = "playlist-read-private playlist-read-collaborative";

function generateRandomString(length) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let text = '';
    for (let i = 0; i < length; i++) text += chars.charAt(Math.floor(Math.random() * chars.length));
    return text;
}

async function generateCodeChallenge(verifier) {
    const data = new TextEncoder().encode(verifier);
    const digest = await crypto.subtle.digest('SHA-256', data);
    return btoa(String.fromCharCode(...new Uint8Array(digest)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
}

async function loginWithSpotify() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("code_verifier");

    const codeVerifier = generateRandomString(128);
    localStorage.setItem("code_verifier", codeVerifier);
    const codeChallenge = await generateCodeChallenge(codeVerifier);

    const authUrl = `https://accounts.spotify.com/authorize?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scopes)}&code_challenge_method=S256&code_challenge=${codeChallenge}`;
    window.location.href = authUrl;
}

async function handleRedirect(code) {
    const codeVerifier = localStorage.getItem("code_verifier");
    if (!codeVerifier) {
        alert("Code verifier missing. Please login again.");
        return null;
    }

    const body = new URLSearchParams({
        grant_type: "authorization_code",
        code: code,
        redirect_uri: redirectUri,
        client_id: clientId,
        code_verifier: codeVerifier
    });

    try {
        const response = await fetch("https://accounts.spotify.com/api/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: body
        });

        if (!response.ok) throw new Error("Token request failed");

        const data = await response.json();
        localStorage.setItem("access_token", data.access_token);

        window.history.replaceState({}, document.title, window.location.pathname);
        return data.access_token;
    } catch (err) {
        console.error(err);
        alert("Failed to login. Please try again.");
        localStorage.removeItem("access_token");
        localStorage.removeItem("code_verifier");
        return null;
    }
}

async function init() {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    let accessToken = localStorage.getItem("access_token");

    if (code) {
        accessToken = await handleRedirect(code);
    }

    if (accessToken) {
        loginBtn.style.display = "none";
        inputContainer.style.display = "flex";
    } else {
        loginBtn.style.display = "block";
        inputContainer.style.display = "none";
    }
}

async function fetchPlaylist(playlistId) {
    let token = localStorage.getItem("access_token");
    if (!token) {
        alert("Session expired or not logged in. Redirecting to login.");
        loginBtn.style.display = "block";
        inputContainer.style.display = "none";
        return;
    }

    const resp = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}`, {
        headers: { Authorization: "Bearer " + token }
    });

    if (!resp.ok) {
        alert("Failed to fetch playlist. Session may have expired. Login again.");
        localStorage.removeItem("access_token");
        loginBtn.style.display = "block";
        inputContainer.style.display = "none";
        return;
    }

    const data = await resp.json();
    displayPlaylist(data.tracks.items);
}

function displayPlaylist(tracks) {
    playlistContainer.innerHTML = "";
    tracks.forEach((t, i) => {
        const div = document.createElement("div");
        div.classList.add("track");
        div.innerHTML = `
            <strong>${i+1}. ${t.track.name}</strong><br>
            Artist: ${t.track.artists.map(a => a.name).join(", ")}<br>
            Album: ${t.track.album.name}
        `;
        playlistContainer.appendChild(div);
    });
    downloadBtn.style.display = "inline-block"; 
}

function downloadCSV(tracks) {
    const rows = ["Track,Artist,Album"];
    tracks.forEach(t => {
        const trackName = t.track.name.replace(/,/g,"");
        const artists = t.track.artists.map(a => a.name).join(" & ").replace(/,/g,"");
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

const loginBtn = document.getElementById("login-btn");
const inputContainer = document.getElementById("input-container");
const playlistContainer = document.getElementById("playlist-container");
const downloadBtn = document.getElementById("download-btn");

loginBtn.addEventListener("click", loginWithSpotify);
document.getElementById("fetch-btn").addEventListener("click", () => {
    const playlistId = document.getElementById("playlist-id").value.trim();
    if (!playlistId) { alert("Enter a playlist ID"); return; }
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

init();






