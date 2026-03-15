import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";

import {

getFirestore,
collection,
addDoc,
getDocs,
deleteDoc,
doc

}

from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";


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


window.addVideo = async function(){

const url = document.getElementById("url").value;
const comment = document.getElementById("comment").value;
const date = document.getElementById("date").value;

if(!url || !date){

alert("日付とURLを入力してください");
return;

}

await addDoc(collection(db,"videos"),{

url:url,
comment:comment,
date:date

});

document.getElementById("url").value="";
document.getElementById("comment").value="";

loadDates();

}


async function loadDates(){

const snapshot = await getDocs(collection(db,"videos"));

const dates = new Set();

snapshot.forEach(doc=>{

dates.add(doc.data().date);

});

const list = document.getElementById("dateList");

list.innerHTML="";

dates.forEach(date=>{

const div=document.createElement("div");

div.className="dateItem";

div.innerText=date;

div.onclick=()=>loadVideos(date);

list.appendChild(div);

});

}


async function loadVideos(date){

document.getElementById("selectedDate").innerText="📅 "+date+" の動画";

const snapshot = await getDocs(collection(db,"videos"));

const list=document.getElementById("videoList");

list.innerHTML="";

snapshot.forEach(docSnap=>{

const data=docSnap.data();

if(data.date!==date) return;

const id=docSnap.id;

const div=document.createElement("div");

div.className="videoCard";

div.innerHTML=`

<div class="url">

<a href="${data.url}" target="_blank">

${data.url}

</a>

</div>

<p>${data.comment || ""}</p>

<button class="delete" onclick="deleteVideo('${id}')">

削除

</button>

`;

list.appendChild(div);

});

}


window.deleteVideo = async function(id){

await deleteDoc(doc(db,"videos",id));

loadDates();

}


loadDates();
