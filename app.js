import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";

import {
getFirestore,
collection,
addDoc,
getDocs,
deleteDoc,
doc,
query,
where
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


const dateInput=document.getElementById("date");

dateInput.addEventListener("change",loadVideos);


window.addVideo=async function(){

const url=document.getElementById("url").value;
const date=document.getElementById("date").value;

if(!url||!date){

alert("日付とURLを入力してください");
return;

}

await addDoc(collection(db,"videos"),{

url:url,
date:date

});

document.getElementById("url").value="";

loadVideos();

}


function getVideoId(url){

const reg=/v=([^&]+)/;
const match=url.match(reg);

if(match){

return match[1];

}

return "";

}


async function loadVideos(){

const date=document.getElementById("date").value;

document.getElementById("selectedDate").innerText="📅 "+date+" の動画";

const q=query(

collection(db,"videos"),
where("date","==",date)

);

const snapshot=await getDocs(q);

const list=document.getElementById("videoList");

list.innerHTML="";

snapshot.forEach((docSnap)=>{

const data=docSnap.data();
const id=docSnap.id;

const videoId=getVideoId(data.url);

const thumbnail=

"https://img.youtube.com/vi/"+videoId+"/hqdefault.jpg";

const div=document.createElement("div");

div.className="videoCard";

div.innerHTML=`

<img class="thumbnail" src="${thumbnail}">

<div class="videoBody">

<a href="${data.url}" target="_blank">

YouTubeで見る

</a>

<br>

<button class="delete" onclick="deleteVideo('${id}')">

削除

</button>

</div>

`;

list.appendChild(div);

});

}


window.deleteVideo=async function(id){

await deleteDoc(doc(db,"videos",id));

loadVideos();

}
