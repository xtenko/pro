// Supabase Config
const SUPABASE_URL = "https://qslfgjasizcayrrcqjdp.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFzbGZnamFzaXpjYXlycmNxamRwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ2MTU5MjUsImV4cCI6MjA3MDE5MTkyNX0.u7bGrxlycZZi8jBPk1Y5qM79PvXfIAaJ5jmjvp6CjxY";
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Toggle password visibility
function togglePassword(id) {
  const input = document.getElementById(id);
  input.type = input.type === "password" ? "text" : "password";
}

// Show forms
function showRegister() {
  document.getElementById("login-form").style.display = "none";
  document.getElementById("register-form").style.display = "block";
  document.getElementById("forgot-form").style.display = "none";
}
function showLogin() {
  document.getElementById("login-form").style.display = "block";
  document.getElementById("register-form").style.display = "none";
  document.getElementById("forgot-form").style.display = "none";
}
function showForgotPassword() {
  document.getElementById("login-form").style.display = "none";
  document.getElementById("register-form").style.display = "none";
  document.getElementById("forgot-form").style.display = "block";
}

// Register user
async function register() {
  const nickname = document.getElementById("register-nickname").value;
  const password = document.getElementById("register-password").value;

  if (!nickname || !password) return alert("Isi semua kolom!");

  const { data, error } = await supabase.from("users").insert([{ nickname, password }]);
  if (error) return alert("Error: " + error.message);
  alert("Pendaftaran berhasil!");
  showLogin();
}

// Login user
async function login() {
  const nickname = document.getElementById("login-nickname").value;
  const password = document.getElementById("login-password").value;

  const { data, error } = await supabase.from("users")
    .select("*")
    .eq("nickname", nickname)
    .eq("password", password)
    .single();

  if (error || !data) return alert("Login gagal!");
  localStorage.setItem("nickname", nickname);
  window.location.href = "dashboard.html";
}

// Reset password
async function resetPassword() {
  const nickname = document.getElementById("forgot-nickname").value;
  const newPass = prompt("Masukkan password baru:");
  if (!newPass) return;

  const { error } = await supabase.from("users")
    .update({ password: newPass })
    .eq("nickname", nickname);

  if (error) return alert("Error: " + error.message);
  alert("Password berhasil diubah!");
  showLogin();
}

// Cek login
if (location.pathname.includes("dashboard.html") || location.pathname.includes("uploads.html")) {
  if (!localStorage.getItem("nickname")) {
    window.location.href = "index.html";
  } else {
    loadFiles();
  }
}

// Logout
function logout() {
  localStorage.removeItem("nickname");
  window.location.href = "index.html";
}

// Upload file
async function uploadFile() {
  const file = document.getElementById("file-input").files[0];
  if (!file) return alert("Pilih file dulu!");

  const nickname = localStorage.getItem("nickname");
  if (!nickname) return alert("Pengguna tidak ditemukan, silakan login ulang!");

  const normalizedNickname = nickname.toLowerCase().replace(/\s/g, '');
  const { data, error } = await supabase.storage
    .from("uploads")
    .upload(`${normalizedNickname}/${Date.now()}_${file.name}`, file, {
      headers: { Authorization: `Bearer ${SUPABASE_KEY}`, 'x-claim-nickname': normalizedNickname }
    });

  if (error) return alert("Error unggah file: " + error.message);
  alert("Unggah file berhasil!");
  loadFiles();
}

// Delete file
async function deleteFile(fileName) {
  const nickname = localStorage.getItem("nickname");
  if (!nickname) return alert("Pengguna tidak ditemukan, silakan login ulang!");

  const normalizedNickname = nickname.toLowerCase().replace(/\s/g, '');
  const { data, error } = await supabase.storage
    .from("uploads")
    .remove([`${normalizedNickname}/${fileName}`], {
      headers: { Authorization: `Bearer ${SUPABASE_KEY}`, 'x-claim-nickname': normalizedNickname }
    });

  if (error) return alert("Error hapus file: " + error.message);
  alert("File berhasil dihapus!");
  loadFiles();
}

// Rename file
async function renameFile(oldName) {
  const nickname = localStorage.getItem("nickname");
  if (!nickname) return alert("Pengguna tidak ditemukan, silakan login ulang!");

  const normalizedNickname = nickname.toLowerCase().replace(/\s/g, '');
  const newName = prompt("Masukkan nama file baru:", oldName);
  if (!newName || newName === oldName) return;

  const { data, error } = await supabase.storage
    .from("uploads")
    .move(`${normalizedNickname}/${oldName}`, `${normalizedNickname}/${newName}`, {
      headers: { Authorization: `Bearer ${SUPABASE_KEY}`, 'x-claim-nickname': normalizedNickname }
    });

  if (error) return alert("Error ganti nama file: " + error.message);
  alert("File berhasil diganti nama!");
  loadFiles();
}

// Load file list
async function loadFiles() {
  const nickname = localStorage.getItem("nickname");
  if (!nickname) return alert("Pengguna tidak ditemukan, silakan login ulang!");

  const normalizedNickname = nickname.toLowerCase().replace(/\s/g, '');
  const { data, error } = await supabase.storage
    .from("uploads")
    .list(normalizedNickname, {
      headers: { Authorization: `Bearer ${SUPABASE_KEY}`, 'x-claim-nickname': normalizedNickname }
    });

  if (error) return alert("Error memuat daftar file: " + error.message);

  const list = document.getElementById("file-list");
  list.innerHTML = "";
  data.forEach(f => {
    const li = document.createElement("li");
    li.innerHTML = `
      <a href="${SUPABASE_URL}/storage/v1/object/public/uploads/${normalizedNickname}/${f.name}" target="_blank">${f.name}</a>
      <button class="delete" onclick="deleteFile('${f.name}')">Hapus</button>
      <button class="rename" onclick="renameFile('${f.name}')">Ganti Nama</button>
    `;
    list.appendChild(li);
  });
}