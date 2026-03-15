import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";

import {
getFirestore,
collection,
addDoc,
deleteDoc,
doc,
updateDoc,
onSnapshot,
query,
orderBy
}
from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* パスワード */

window.onload=function(){

const password="54315";

const userPass=prompt("サイト閲覧にはパスワードが必要です:");

if(userPass!==password){

document.body.innerHTML="<h2 style='text-align:center;margin-top:50px;color:red;'>パスワードが違います</h2>";

}

}

/* Firebase */

const firebaseConfig={

apiKey:"AIzaSyBONAWg79Un6Tag0vPP0PB0UiqJLL6KvtM",

authDomain:"shareboard-ee031.firebaseapp.com",

projectId:"shareboard-ee031",

storageBucket:"shareboard-ee031.firebasestorage.app",

messagingSenderId:"972674645025",

appId:"1:972674645025:web:468e8a52a964e4a53e3760"

};

const app=initializeApp(firebaseConfig);

const db=getFirestore(app);

const videosRef=collection(db,"videos");

let currentDate=null;

let calendarYear=new Date().getFullYear();

let calendarMonth=new Date().getMonth();

let lastSnapshot=null;

/* 投稿 */

window.addVideo=async function(){

const url=document.getElementById("url").value;

const comment=document.getElementById("comment").value;

const date=document.getElementById("date").value;

if(!url||!date){

alert("日付とURLを入力してください");

return;

}

await addDoc(videosRef,{url,comment,date,order:0});

document.getElementById("url").value="";

document.getElementById("comment").value="";

}

/* 削除 */

window.deleteVideo=async function(id){

await deleteDoc(doc(db,"videos",id));

}

/* 編集 */

window.editComment=function(id){

const div=document.getElementById("comment-"+id);

const text=div.innerText;

div.innerHTML=`<input id="editInput-${id}" value="${text}">
<button class="save" onclick="saveComment('${id}')">保存</button>`;

}

window.saveComment=async function(id){

const value=document.getElementById("editInput-"+id).value;

await updateDoc(doc(db,"videos",id),{comment:value});

}

/* 動画表示 */

function renderVideos(snapshot){

const list=document.getElementById("videoList");

list.innerHTML="";

snapshot.forEach(docSnap=>{

const data=docSnap.data();

if(currentDate&&data.date!==currentDate)return;

const div=document.createElement("div");

div.className="videoCard";

div.innerHTML=`

<div class="videoInfo">

<strong>📅 ${data.date}</strong>

<div class="url">

<a href="${data.url}" target="_blank">

${data.url}

</a>

</div>

<div class="comment" id="comment-${docSnap.id}">

${data.comment||""}

</div>

</div>

<div>

<button class="edit" onclick="editComment('${docSnap.id}')">編集</button>

<button class="delete" onclick="deleteVideo('${docSnap.id}')">削除</button>

</div>

`;

list.appendChild(div);

});

}

/* 月移動 */

window.prevMonth=function(){

calendarMonth--;

if(calendarMonth<0){

calendarMonth=11;

calendarYear--;

}

renderCalendar(lastSnapshot);

}

window.nextMonth=function(){

calendarMonth++;

if(calendarMonth>11){

calendarMonth=0;

calendarYear++;

}

renderCalendar(lastSnapshot);

}

/* カレンダー */

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

week.forEach(d=>{

const w=document.createElement("div");

w.innerText=d;

w.style.textAlign="center";

calendar.appendChild(w);

});

const firstDay=new Date(calendarYear,calendarMonth,1).getDay();

const days=new Date(calendarYear,calendarMonth+1,0).getDate();

for(let i=0;i<firstDay;i++){

calendar.appendChild(document.createElement("div"));

}

for(let d=1;d<=days;d++){

const day=document.createElement("div");

day.className="calendar-day";

const dateStr=`${calendarYear}-${String(calendarMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;

day.innerText=d;

snapshot.forEach(doc=>{

if(doc.data().date===dateStr){

day.classList.add("hasVideo");

}

});

day.onclick=()=>{

currentDate=dateStr;

renderVideos(snapshot);

};

calendar.appendChild(day);

}

}

/* Firestore */

const q=query(videosRef,orderBy("order","asc"));

onSnapshot(q,(snapshot)=>{

renderCalendar(snapshot);

renderVideos(snapshot);

});
