import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, deleteDoc, doc, updateDoc, onSnapshot, query, orderBy } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* パスワード保護 */
window.onload = function(){
  const password = "54315";
  const userPass = prompt("サイト閲覧にはパスワードが必要です:");
  if(userPass !== password){
    alert("パスワードが間違っています。サイトを閉じます。");
    document.body.innerHTML = "<h2 style='text-align:center;margin-top:50px;color:red;'>パスワードが違います</h2>";
    return;
  }
}

const firebaseConfig = {
  apiKey: "AIzaSyBONAWg79Un6Tag0vPP0PB0UiqJLL6KvtM",
  authDomain: "shareboard-ee031.firebaseapp.com",
  projectId: "shareboard-ee031",
  storageBucket: "shareboard-ee031.firebasestorage.app",
  messagingSenderId: "972674645025",
  appId: "1:972674645025:web:468e8a52a964e4a53e3760"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const videosRef = collection(db,"videos");

let currentDate = null;
let sortableInitialized = false;

/* 投稿 */
window.addVideo = async function(){
  const url = document.getElementById("url").value;
  const comment = document.getElementById("comment").value;
  const date = document.getElementById("date").value;
  if(!url || !date){alert("日付とURLを入力してください"); return;}
  await addDoc(videosRef,{url, comment, date, order: 0});
  document.getElementById("url").value="";
  document.getElementById("comment").value="";
}

/* コメント編集 */
window.editComment = function(id){
  const commentDiv = document.getElementById("comment-"+id);
  const text = commentDiv.innerText;
  commentDiv.innerHTML = `<input type="text" id="editInput-${id}" value="${text}">
  <button class="save" onclick="saveComment('${id}')">保存</button>`;
}

window.saveComment = async function(id){
  const input = document.getElementById("editInput-"+id);
  await updateDoc(doc(db,"videos",id), {comment: input.value});
}

/* 削除 */
window.deleteVideo = async function(id){
  await deleteDoc(doc(db,"videos",id));
}

/* Firestore順序更新 */
async function updateOrderInFirestore(id, order){
  await updateDoc(doc(db, "videos", id), { order });
}

/* 動画一覧表示 */
function renderVideos(snapshot){
  const list = document.getElementById("videoList");
  list.innerHTML = "";

  const videos = snapshot.docs.map(docSnap => ({id: docSnap.id, ...docSnap.data()}));
  videos.sort((a,b) => (a.order||0) - (b.order||0));

  videos.forEach(data => {
    if(currentDate && data.date!==currentDate) return;

    const div = document.createElement("div");
    div.className = "videoCard";
    div.dataset.id = data.id;

    div.innerHTML = `
      <div class="videoInfo">
        <strong>📅 ${data.date}</strong>
        <div class="url">${data.url}</div>
        <div class="comment" id="comment-${data.id}">${data.comment || ""}</div>
      </div>
      <div>
        <button class="edit" onclick="editComment('${data.id}')">編集</button>
        <button class="delete" onclick="deleteVideo('${data.id}')">削除</button>
      </div>
    `;

    list.appendChild(div);
  });

  if(!sortableInitialized){
    new Sortable(list, {
      animation:150,
      onEnd(evt){
        const items = list.querySelectorAll(".videoCard");
        items.forEach((item,index)=>{
          updateOrderInFirestore(item.dataset.id,index);
        });
      }
    });
    sortableInitialized = true;
  }
}

/* カレンダー表示 */
function renderCalendar(snapshot){
  const calendarDiv = document.getElementById("calendar");
  calendarDiv.innerHTML="";

  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const daysInMonth = new Date(year, month+1, 0).getDate();

  for(let d=1; d<=daysInMonth; d++){
    const dayDiv = document.createElement("div");
    dayDiv.className="calendar-day";
    const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    dayDiv.innerText=d;

    if(today.getDate()===d){ dayDiv.classList.add("today"); }

    snapshot.forEach(doc=>{
      if(doc.data().date===dateStr){ dayDiv.classList.add("hasVideo"); }
    });

    dayDiv.onclick=()=>{
      currentDate=dateStr;
      renderVideos(snapshot);
      highlightCalendarDay(dateStr);
    };
    calendarDiv.appendChild(dayDiv);
  }
}

function highlightCalendarDay(dateStr){
  const days = document.querySelectorAll(".calendar-day");
  days.forEach(day=>{
    if(day.innerText==parseInt(dateStr.split('-')[2])) day.classList.add("active");
    else day.classList.remove("active");
  });
  document.getElementById("selectedDate").innerText = currentDate ? `${currentDate} の動画` : "すべての動画";
}

/* Firestoreリアルタイム同期 */
const q = query(videosRef, orderBy("order","asc"));
onSnapshot(q,(snapshot)=>{
  renderCalendar(snapshot);
  renderVideos(snapshot);
});

/*const firebaseConfig = {
  apiKey: "AIzaSyBONAWg79Un6Tag0vPP0PB0UiqJLL6KvtM",
  authDomain: "shareboard-ee031.firebaseapp.com",
  projectId: "shareboard-ee031",
  storageBucket: "shareboard-ee031.firebasestorage.app",
  messagingSenderId: "972674645025",
  appId: "1:972674645025:web:468e8a52a964e4a53e3760"
};*/

