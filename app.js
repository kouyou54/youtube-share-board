import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, deleteDoc, doc, updateDoc, onSnapshot, query, orderBy } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

window.onload=function(){
  const password="54315";
  const userPass=prompt("サイト閲覧にはパスワードが必要です:");
  if(userPass!==password){
    document.body.innerHTML="<h2 style='text-align:center;margin-top:50px;color:red;'>パスワードが違います</h2>";
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
const app=initializeApp(firebaseConfig);
const db=getFirestore(app);
const videosRef=collection(db,"videos");

let currentDate=null;
let lastSnapshot=null;
let sortable=null;

window.addVideo=async function(){
  const url=document.getElementById("url").value;
  const comment=document.getElementById("comment").value;
  const date=document.getElementById("date").value;
  if(!url||!date){ alert("日付とURLを入力してください"); return; }
  await addDoc(videosRef,{url,comment,date,order:0});
  document.getElementById("url").value="";
  document.getElementById("comment").value="";
}

window.showCalendarPage=function(){
  document.getElementById("calendarPage").style.display="block";
  document.getElementById("schedulePage").style.display="none";
  document.getElementById("calendarTab").classList.add("active");
  document.getElementById("scheduleTab").classList.remove("active");
}
window.showSchedulePage=function(){
  document.getElementById("calendarPage").style.display="none";
  document.getElementById("schedulePage").style.display="block";
  document.getElementById("scheduleTab").classList.add("active");
  document.getElementById("calendarTab").classList.remove("active");
  renderSchedule(lastSnapshot);
}

window.deleteVideo=async function(id){ await deleteDoc(doc(db,"videos",id)); }

window.editComment=function(id){
  const div=document.getElementById("comment-"+id);
  const text=div.innerText;
  div.innerHTML=`<input id="editInput-${id}" value="${text}"><button class="save" onclick="saveComment('${id}')">保存</button>`;
}
window.saveComment=async function(id){
  const value=document.getElementById("editInput-"+id).value;
  await updateDoc(doc(db,"videos",id),{comment:value});
}

function renderCalendar(snapshot){
  lastSnapshot=snapshot;
  const calendar=document.getElementById("calendar");
  calendar.innerHTML="";
  const today=new Date();
  const year=today.getFullYear();
  const month=today.getMonth();
  const firstDay=new Date(year,month,1).getDay();
  const daysInMonth=new Date(year,month+1,0).getDate();

  const week=["日","月","火","水","木","金","土"];
  week.forEach(d=>{ const w=document.createElement("div"); w.innerText=d; w.style.textAlign="center"; calendar.appendChild(w); });

  for(let i=0;i<firstDay;i++) calendar.appendChild(document.createElement("div"));

  for(let d=1;d<=daysInMonth;d++){
    const day=document.createElement("div");
    day.className="calendar-day";
    const dateStr=`${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    day.innerText=d;

    day.onclick=()=>{ currentDate=dateStr; document.getElementById("selectedDate").innerText=currentDate+" の動画"; renderVideoList(snapshot); }
    calendar.appendChild(day);
  }
}

function renderVideoList(snapshot){
  const list=document.getElementById("videoList");
  list.innerHTML="";
  const videos=snapshot.docs.map(docSnap=>({id:docSnap.id,...docSnap.data()}));
  videos.sort((a,b)=>(a.order||0)-(b.order||0));
  videos.forEach(data=>{
    if(currentDate && data.date!==currentDate) return;
    const div=document.createElement("div");
    div.className="videoCard";
    div.dataset.id=data.id;
    div.innerHTML=`
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
    sortable=new Sortable(list,{ animation:150, ghostClass:"dragging", onEnd:evt=>{
      const items=list.querySelectorAll(".videoCard");
      items.forEach((item,index)=>{ updateDoc(doc(db,"videos",item.dataset.id),{order:index}); });
    }});
  }
}

function renderSchedule(snapshot){
  const schedule=document.getElementById("scheduleList");
  schedule.innerHTML="";
  const grouped={};
  snapshot.docs.forEach(doc=>{ const data=doc.data(); if(!grouped[data.date]) grouped[data.date]=[]; grouped[data.date].push(data); });

  Object.keys(grouped).sort().forEach(date=>{
    const div=document.createElement("div");
    div.className="videoCard";
    const dateHeader=document.createElement("div");
    dateHeader.innerHTML=`<strong>📅 ${date}</strong>`;
    dateHeader.style.marginBottom="8px";
    div.appendChild(dateHeader);

    const ul=document.createElement("ul");
    grouped[date].forEach(v=>{ const li=document.createElement("li"); li.innerHTML=`<i class="fas fa-basketball-ball"></i> ${v.comment||v.url}`; ul.appendChild(li); });
    div.appendChild(ul);
    schedule.appendChild(div);
  });
}

const q=query(videosRef,orderBy("order","asc"));
onSnapshot(q,snapshot=>{
  lastSnapshot=snapshot;
  renderCalendar(snapshot);
  if(document.getElementById("calendarPage").style.display==="block") renderVideoList(snapshot);
});
