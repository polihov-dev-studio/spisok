
const PASSWORD="1234";
const REPO="owner/repo";
const FILE="data.json";

let token=localStorage.getItem("gh_token")||"";

let data={lists:{Main:[]},current:"Main"};
let editIndex=null;

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
 data.lists[newList.value]=[];
 data.current=newList.value;
 render();
}

function switchList(){data.current=listSelect.value;render()}

function saveItem(){
 let item={
  title:title.value,
  price:price.value,
  image:image.value,
  bought:false
 };

 if(editIndex!==null){
  data.lists[data.current][editIndex]=item;
  editIndex=null;
 }else{
  data.lists[data.current].push(item);
 }

 title.value="";price.value="";image.value="";
 render();
}

function editItem(i){
 let item=data.lists[data.current][i];
 title.value=item.title;
 price.value=item.price;
 image.value=item.image;
 editIndex=i;
}

function deleteItem(i){
 data.lists[data.current].splice(i,1);
 render();
}

function toggleBought(i){
 let item=data.lists[data.current][i];
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

 let items=data.lists[data.current];
 let s=search.value.toLowerCase();

 itemsDiv.innerHTML="";
 let plan=0,bought=0;

 items.filter(i=>i.title.toLowerCase().includes(s)).forEach((i,idx)=>{
  if(i.bought)bought+=Number(i.price||0);
  else plan+=Number(i.price||0);

  let el=document.createElement("div");
  el.className="item";
  el.innerHTML=`
   ${i.image?`<img src="${i.image}">`:""}
   <h3>${i.title}</h3>
   <p>${i.price}</p>
   <button onclick="toggleBought(${idx})">${i.bought?"Вернуть":"Куплено"}</button>
   <button onclick="editItem(${idx})">Редактировать</button>
   <button onclick="deleteItem(${idx})">Удалить</button>
  `;
  itemsDiv.appendChild(el);
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
