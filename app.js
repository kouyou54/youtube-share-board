// Firebase初期化
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

let currentUser = null;

// FullCalendar 初期化
const calendarEl = document.getElementById('calendar');
const calendar = new FullCalendar.Calendar(calendarEl, {
  initialView: 'dayGridMonth',
  events: [],
  eventClick: function(info) {
    if(info.event.extendedProps.user === currentUser) {
      if(confirm('この動画を削除しますか？')) {
        db.collection('videos').doc(info.event.id).delete();
      }
    } else {
      alert('他のユーザーの投稿は削除できません');
    }
  },
});
calendar.render();

// ログイン
const loginBtn = document.getElementById("loginBtn");
const userInfo = document.getElementById("userInfo");

loginBtn.addEventListener("click", () => {
  const provider = new firebase.auth.GoogleAuthProvider();
  auth.signInWithPopup(provider);
});

// ユーザー状態の監視
auth.onAuthStateChanged(user => {
  if(user) {
    currentUser = user.displayName;
    userInfo.textContent = `ログイン中: ${currentUser}`;
    loginBtn.style.display = 'none';
  } else {
    currentUser = null;
    userInfo.textContent = '';
    loginBtn.style.display = 'block';
  }
});

// 動画追加
const addForm = document.getElementById("addForm");
addForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  if(!currentUser) return alert('ログインしてください');
  
  const date = document.getElementById("videoDate").value;
  const title = document.getElementById("videoTitle").value;
  const url = document.getElementById("videoUrl").value;

  const docRef = await db.collection("videos").add({ date, title, url, user: currentUser });
  addForm.reset();
});

// Firestoreのリアルタイム監視
db.collection("videos").onSnapshot(snapshot => {
  calendar.getEvents().forEach(event => event.remove()); // 既存イベント削除
  snapshot.forEach(doc => {
    const data = doc.data();
    calendar.addEvent({
      id: doc.id,
      title: data.title,
      start: data.date,
      url: data.url,
      extendedProps: { user: data.user }
    });
  });
});
