const PASSWORD="1234";
let token=localStorage.getItem("gh_token")||"";
let data={lists:{Default:[]} , current:"Default"};

function login(){
  if(document.getElementById("password").value===PASSWORD){
    document.getElementById("auth").style.display="none";
    document.getElementById("app").style.display="block";
    load();
  }
}

function toggleFilters(){
  let f=document.getElementById("filters");
  f.style.display=f.style.display==="none"?"block":"none";
}

function addList(){
  let name=document.getElementById("newList").value;
  if(!name)return;
  data.lists[name]=[];
  data.current=name;
  render();
}

function switchList(){
  data.current=document.getElementById("listSelect").value;
  render();
}

function addItem(){
  let title=document.getElementById("title").value;
  let price=document.getElementById("price").value;
  if(!title)return;
  data.lists[data.current].push({title,price});
  render();
}

function render(){
  let sel=document.getElementById("listSelect");
  sel.innerHTML="";
  Object.keys(data.lists).forEach(l=>{
    let opt=document.createElement("option");
    opt.value=l;opt.text=l;
    if(l===data.current)opt.selected=true;
    sel.appendChild(opt);
  });

  let items=data.lists[data.current];
  let search=document.getElementById("search").value.toLowerCase();
  let div=document.getElementById("items");
  div.innerHTML="";
  let sum=0;

  items.filter(i=>i.title.toLowerCase().includes(search)).forEach(i=>{
    sum+=Number(i.price||0);
    let el=document.createElement("div");
    el.innerText=i.title+" - "+i.price;
    div.appendChild(el);
  });

  let total=document.createElement("div");
  total.innerText="Итого: "+sum;
  div.appendChild(total);
}

function saveToGithub(){
  let repo=prompt("owner/repo");
  let path="data.json";
  if(!token){
    token=prompt("GitHub token");
    localStorage.setItem("gh_token",token);
  }
  fetch(`https://api.github.com/repos/${repo}/contents/${path}`,{
    method:"PUT",
    headers:{Authorization:"token "+token},
    body:JSON.stringify({
      message:"update data",
      content:btoa(unescape(encodeURIComponent(JSON.stringify(data,null,2))))
    })
  }).then(()=>alert("Сохранено"));
}

function load(){render();}
