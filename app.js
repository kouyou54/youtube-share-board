import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, deleteDoc, doc, updateDoc, onSnapshot, query, orderBy } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import Sortable from "https://cdnjs.cloudflare.com/ajax/libs/Sortable/1.15.0/Sortable.min.js";

// Firebase設定
const firebaseConfig = {
  apiKey: "AIzaSyBONAWg79Un6Tag0vPP0PB0UiqJLL6KvtM",
  authDomain: "shareboard-ee031.firebaseapp.com",
  projectId: "shareboard-ee031",
  storageBucket: "shareboard-ee031.firebasestorage.app",
  messagingSenderId: "972674645025",
  appId: "1:972674645025:web:468e8a52a964e4a53e3760"
};

// Firebase初期化
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const videosRef = collection(db, "videos");

let selectedDate = null;
let videos = {};
const correctPassword = "54315";

// ===== ログイン関数 =====
function checkPassword() {
  const password = document.getElementById("passwordInput").value.trim();
  if (password === correctPassword) {
    localStorage.setItem('loggedIn', 'true');
    document.getElementById("loginScreen").style.display = "none";
    document.getElementById("siteContent").style.display = "block";
    loadVideos();
  } else {
    alert("パスワードが間違っています。");
  }
}
window.checkPassword = checkPassword;

// ===== 動画追加 =====
async function addVideo() {
  const date = document.getElementById("date").value;
  const url = document.getElementById("url").value.trim();
  const comment = document.getElementById("comment").value.trim();

  if (!date || !url) {
    alert("日付とURLを入力してください");
    return;
  }

  const newVideo = { url, comment, date, order: 0 };
  await addDoc(videosRef, newVideo);

  document.getElementById("url").value = "";
  document.getElementById("comment").value = "";
}
window.addVideo = addVideo;

// ===== Firestoreから動画読み込み =====
function loadVideos() {
  const q = query(videosRef, orderBy("date", "asc"));
  onSnapshot(q, (snapshot) => {
    videos = {};
    snapshot.docs.forEach((docItem) => {
      const data = docItem.data();
      if (!videos[data.date]) videos[data.date] = [];
      videos[data.date].push({ ...data, id: docItem.id });
    });
    renderVideos();
    highlightCalendar();
  });
}

// ===== 動画レンダリング =====
function renderVideos() {
  const container = document.getElementById("videoList");
  container.innerHTML = "";

  const datesToShow = selectedDate ? [selectedDate] : Object.keys(videos).sort();

  datesToShow.forEach((date) => {
    if (!videos[date]) return;

    videos[date].forEach((video, index) => {
      const card = document.createElement("div");
      card.className = "videoCard";
      card.dataset.date = date;
      card.dataset.index = index;

      const info = document.createElement("div");
      info.className = "videoInfo";
      info.innerHTML = `<div class="url">${video.url}</div>
                        <div class="comment">${video.comment}</div>`;

      const editBtn = document.createElement("button");
      editBtn.textContent = "編集";
      editBtn.className = "edit";
      editBtn.onclick = () => editVideo(date, index);

      const deleteBtn = document.createElement("button");
      deleteBtn.textContent = "削除";
      deleteBtn.className = "delete";
      deleteBtn.onclick = () => deleteVideo(date, index);

      card.appendChild(info);
      card.appendChild(editBtn);
      card.appendChild(deleteBtn);

      container.appendChild(card);
    });
  });

  // ドラッグで順番入れ替え
  new Sortable(container, {
    animation: 150,
    onEnd: function (evt) {
      const parentDate = evt.item.dataset.date;
      const item = videos[parentDate].splice(evt.oldIndex, 1)[0];
      videos[parentDate].splice(evt.newIndex, 0, item);
      renderVideos();
    }
  });
}
window.renderVideos = renderVideos;

// ===== 編集 =====
async function editVideo(date, index) {
  const newComment = prompt("コメントを編集:", videos[date][index].comment);
  if (newComment !== null) {
    videos[date][index].comment = newComment;
    await updateDoc(doc(db, "videos", videos[date][index].id), { comment: newComment });
    renderVideos();
  }
}
window.editVideo = editVideo;

// ===== 削除 =====
async function deleteVideo(date, index) {
  if (confirm("削除しますか？")) {
    await deleteDoc(doc(db, "videos", videos[date][index].id));
    videos[date].splice(index, 1);
    if (videos[date].length === 0) delete videos[date];
    renderVideos();
    highlightCalendar();
  }
}
window.deleteVideo = deleteVideo;

// ===== カレンダー表示 =====
function highlightCalendar() {
  const calendar = document.getElementById("calendar");
  calendar.innerHTML = "";
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  for (let i = 0; i < firstDay; i++) {
    const empty = document.createElement("div");
    calendar.appendChild(empty);
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dayDiv = document.createElement("div");
    dayDiv.className = "calendar-day";
    const dateStr = `${year}-${String(month + 1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
    dayDiv.textContent = d;

    if (videos[dateStr] && videos[dateStr].length > 0) dayDiv.classList.add("hasVideo");
    if (dateStr === selectedDate) dayDiv.classList.add("active");
    const todayStr = `${year}-${String(month+1).padStart(2,"0")}-${String(today.getDate()).padStart(2,"0")}`;
    if (dateStr === todayStr) dayDiv.classList.add("today");

    dayDiv.onclick = () => {
      selectedDate = dateStr;
      document.getElementById("selectedDate").textContent = dateStr + "の動画";
      renderVideos();
      highlightCalendar();
    };

    calendar.appendChild(dayDiv);
  }
}
window.highlightCalendar = highlightCalendar;

// ===== ページ読み込み時 =====
window.onload = function () {
  if (localStorage.getItem('loggedIn') === 'true') {
    document.getElementById("loginScreen").style.display = "none";
    document.getElementById("siteContent").style.display = "block";
    loadVideos();
  } else {
    document.getElementById("loginScreen").style.display = "block";
  }
};
