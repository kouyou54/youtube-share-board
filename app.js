import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, deleteDoc, doc, updateDoc, onSnapshot, query, orderBy } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* パスワード */
window.onload = function(){
  const password = "54315";
  const userPass = prompt("サイト閲覧にはパスワードが必要です:");
  if(userPass !== password){
    document.body.innerHTML="<h2 style='text-align:center;margin-top:50px;color:red;'>パスワードが違います</h2>";
  }
}

/* Firebase */
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
let filterMode = "all";
let viewMode = "videos";
let calendarYear = new Date().getFullYear();
let calendarMonth = new Date().getMonth();
let lastSnapshot = null;
let sortable = null;

/* 投稿 */
window.addVideo = async function(){
  const url = document.getElementById("url").value;
  const comment = document.getElementById("comment").value;
  const date = document.getElementById("date").value;
  if(!url || !date){ alert("日付とURLを入力してください"); return; }
  await addDoc(videosRef,{url,comment,date,order:0});
  document.getElementById("url").value="";
  document.getElementById("comment").value="";
}

/* フィルター切替 */
function updateFilterButton(){
  const allBtn = document.getElementById("allBtn");
  const dateBtn = document.getElementById("dateBtn");
  if(filterMode==="all"){
    allBtn.classList.add("active");
    dateBtn.classList.remove("active");
  } else if(filterMode==="date"){
    dateBtn.classList.add("active");
    allBtn.classList.remove("active");
  }
}
window.showAllVideos = function(){ filterMode="all"; renderVideos(lastSnapshot); document.getElementById("selectedDate").innerText="すべての動画"; updateFilterButton(); }
window.showSelectedVideos = function(){ if(!currentDate){ alert("先にカレンダーの日付を選択してください"); return; } filterMode="date"; renderVideos(lastSnapshot); document.getElementById("selectedDate").innerText=currentDate+" の動画"; updateFilterButton(); }

/* ビュー切替 */
window.showVideoList = function(){ viewMode="videos"; renderVideos(lastSnapshot); }
window.showSchedule = function(){ viewMode="schedule"; renderSchedule(lastSnapshot); }

/* 削除 */
window.deleteVideo = async function(id){ await deleteDoc(doc(db,"videos",id)); }

/* コメント編集 */
window.editComment = function(id){ const div=document.getElementById("comment-"+id); const text=div.innerText; div.innerHTML=`<input id="editInput-${id}" value="${text}"><button class="save" onclick="saveComment('${id}')">保存</button>` }
window.saveComment = async function(id){ const value=document.getElementById("editInput-"+id).value; await updateDoc(doc(db,"videos",id),{comment:value}); }

/* 動画リスト表示 */
function renderVideos(snapshot){
  if(viewMode!=="videos") return renderSchedule(snapshot);
  const list=document.getElementById("videoList");
  list.innerHTML="";
  const videos=snapshot.docs.map(docSnap=>({id:docSnap.id,...docSnap.data()}));
  videos.sort((a,b)=>(a.order||0)-(b.order||0));

  videos.forEach(data=>{
    if(filterMode==="date" && data.date!==currentDate) return;

    const div=document.createElement("div");
    div.className="videoCard";
    div.dataset.id=data.id;
    div.innerHTML=`
      <div class="dragHandle"><i class="fas fa-grip-lines"></i></div>
      <div class="videoInfo">
        <strong>📅 ${data.date}</strong>
        <div class="url"><a href="${data.url}" target="_blank">${data.url}</a></div>
        <div class="comment" id="comment-${data.id}">${data.comment||""}</div>
      </div>
      <div class="buttons">
        <button class="edit" onclick="editComment('${data.id}')">編集</button>
        <button class="delete" onclick="deleteVideo('${data.id}')">削除</button>
      </div>
    `;
    list.appendChild(div);
  });

  if(!sortable){
    sortable = new Sortable(list,{
      handle:".dragHandle",
      animation:200,
      easing:"cubic-bezier(0.25,1,0.5,1)",
      delay:100,
      delayOnTouchOnly:true,
      touchStartThreshold:5,
      ghostClass:"dragging",
      chosenClass:"chosen",
      onEnd(evt){
        const items=list.querySelectorAll(".videoCard");
        items.forEach((item,index)=>{ updateDoc(doc(db,"videos",item.dataset.id),{order:index}); });
      }
    });
  }
}

/* 予定表表示 */
function renderSchedule(snapshot){
  viewMode="schedule";
  const list=document.getElementById("videoList");
  list.innerHTML="";
  const grouped={};
  snapshot.docs.forEach(doc=>{ const data=doc.data(); if(!grouped[data.date]) grouped[data.date]=[]; grouped[data.date].push(data); });

  Object.keys(grouped).sort().forEach(date=>{
    const div=document.createElement("div");
    div.className="videoCard";
    const dateHeader=document.createElement("div");
    dateHeader.innerHTML=`<strong>📅 ${date} (${grouped[date].length}本)</strong>`;
    dateHeader.style.marginBottom="8px";
    div.appendChild(dateHeader);

    const ul=document.createElement("ul");
    grouped[date].forEach(v=>{ const li=document.createElement("li"); li.innerHTML=`<i class="fas fa-basketball-ball"></i> ${v.comment || v.url}`; ul.appendChild(li); });
    div.appendChild(ul);
    list.appendChild(div);
  });
}

/* カレンダー表示 */
function renderCalendar(snapshot){
  lastSnapshot=snapshot;
  const calendar=document.getElementById("calendar");
  calendar.innerHTML="";
  const title=document.createElement("div");
  title.style.gridColumn="span 7";
  title.style.textAlign="center";
  title.innerHTML=`<button onclick="prevMonth()">◀</button> ${calendarYear}年 ${calendarMonth+1}月 <button onclick="nextMonth()">▶</button>`;
  calendar.appendChild(title);

  const week=["日","月","火","水","木","金","土"];
  week.forEach(d=>{ const w=document.createElement("div"); w.innerText=d; w.style.textAlign="center"; calendar.appendChild(w); });

  const firstDay=new Date(calendarYear,calendarMonth,1).getDay();
  const days=new Date(calendarYear,calendarMonth+1,0).getDate();
  for(let i=0;i<firstDay;i++) calendar.appendChild(document.createElement("div"));

  for(let d=1;d<=days;d++){
    const day=document.createElement("div");
    day.className="calendar-day";
    const dateStr=`${calendarYear}-${String(calendarMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    day.innerText=d;

    const count=snapshot.docs.filter(doc=>doc.data().date===dateStr).length;
    if(count>0){ day.classList.add("hasVideo"); day.innerText=`${d} (${count}本)`; }

    day.onclick=()=>{ currentDate=dateStr; filterMode="date"; renderVideos(snapshot); document.getElementById("selectedDate").innerText=dateStr+" の動画"; updateFilterButton(); };
    calendar.appendChild(day);
  }
}

/* 月移動 */
window.prevMonth=function(){ calendarMonth--; if(calendarMonth<0){ calendarMonth=11; calendarYear--; } renderCalendar(lastSnapshot); }
window.nextMonth=function(){ calendarMonth++; if(calendarMonth>11){ calendarMonth=0; calendarYear++; } renderCalendar(lastSnapshot); }

/* Firestoreリアルタイム */
const q=query(videosRef,orderBy("order","asc"));
onSnapshot(q,(snapshot)=>{ renderCalendar(snapshot); if(viewMode==="videos") renderVideos(snapshot); else renderSchedule(snapshot); updateFilterButton(); });
