const PASSWORD="1234";
const REPO="owner/repo";
const FILE="data.json";

let token=localStorage.getItem("gh_token")||"";

let data={
 lists:{Main:{categories:["Общее"],items:[]}},
 current:"Main"
};

function login(){
 if(password.value===PASSWORD){
  auth.classList.add("hidden");
  app.classList.remove("hidden");
  render();
 }
}

function toggleFilters(){filters.classList.toggle("hidden")}

function addList(){
 if(!newList.value)return;
 data.lists[newList.value]={categories:["Общее"],items:[]};
 data.current=newList.value;
 render();
}

function switchList(){data.current=listSelect.value;render()}

function addItem(){
 let list=data.lists[data.current];
 list.items.push({
  title:title.value,
  price:price.value,
  image:image.value,
  category:category.value,
  bought:false
 });
 render();
}

function toggleBought(i){
 let item=data.lists[data.current].items[i];
 item.bought=!item.bought;
 render();
}

function render(){
 listSelect.innerHTML="";
 Object.keys(data.lists).forEach(l=>{
  let o=document.createElement("option");
  o.value=l;o.text=l;
  if(l===data.current)o.selected=true;
  listSelect.appendChild(o);
 });

 let list=data.lists[data.current];

 category.innerHTML="";
 list.categories.forEach(c=>{
  let o=document.createElement("option");
  o.value=c;o.text=c;
  category.appendChild(o);
 });

 let s=search.value.toLowerCase();
 let div=items;
 div.innerHTML="";
 let plan=0,bought=0;

 list.items.filter(i=>i.title.toLowerCase().includes(s)).forEach((i,idx)=>{
  if(i.bought)bought+=Number(i.price||0);
  else plan+=Number(i.price||0);

  let el=document.createElement("div");
  el.className="item";
  el.innerHTML=`
   ${i.image?`<img src="${i.image}">`:""}
   <h3>${i.title}</h3>
   <p>${i.price}</p>
   <small>${i.category}</small><br>
   <button onclick="toggleBought(${idx})">${i.bought?"Вернуть":"Куплено"}</button>
  `;
  div.appendChild(el);
 });

 stats.innerText=`План: ${plan} | Куплено: ${bought} | Всего: ${plan+bought}`;
}

function save(){
 if(!token){
  token=prompt("GitHub token");
  localStorage.setItem("gh_token",token);
 }

 fetch(`https://api.github.com/repos/${REPO}/contents/${FILE}`,{
  method:"PUT",
  headers:{Authorization:"token "+token},
  body:JSON.stringify({
   message:"update",
   content:btoa(unescape(encodeURIComponent(JSON.stringify(data,null,2))))
  })
 }).then(()=>alert("Сохранено"));
}
