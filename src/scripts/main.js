import uuid from 'uuid';
import Chart from 'chart.js';

// Initialize Firebase
const config = {
  apiKey: "",
  authDomain: "",
  databaseURL: "",
  storageBucket: "",
  messagingSenderId: ""
};
firebase.initializeApp(config);
// Get a reference to the database service
const database = firebase.database();

// create new data
function writeAccountData(id, title, type, number, date) {
  // Get a reference to data according to passed id
  const accountRef = database.ref('account/' + id);
  // set attribute value
  accountRef.set({
    title: title,
    type: type,
    number: number,
    date: date
  });
  // redirect to root page if new data successful created
  accountRef.on('value', function(snapshot) {
    // snapshot mean a static snapshot of the contents at a given path
    console.log('successfully create');
    window.location = '/';
  });
}

function readAccountDate() {
  let str = `
  <thead>
    <tr>
      <th>消費項目</th>
      <th>消費類別</th>
      <th>消費金額</th>
      <th>消費時間</th>
      <th>操作</th>
    </tr>
  </thead>
  `;
  const accountRef = database.ref('account/');
  const infoRef = document.querySelector('#data-chart-info');
  const dataTableRef = document.querySelector('#data-table');

  // when data without listening for changes
  accountRef.once('value').then(function(snapshot) {
    // get snapshot value
    const data = snapshot.val();
    console.log(data);
    if (data === null) {
      str += '<h4>目前還沒有花到錢喔！</h4>';
      dataTableRef.innerHTML = str;
      infoRef.innerHTML = '<h4>目前還沒有花到錢喔！</h4>';
    } else {
      loadChart(data);
      // data is like { id1: {title:....}, id2: {title:....} }
      // use Object.keys(data) to returns an array evenry element is data id
      // then iterate all id
      Object.keys(data).forEach(function(key, index) {
        str += `
        <tr>
          <td>${data[key].title}</td>
          <td>${data[key].type}</td>
          <td>${data[key].number}</td>
          <td>${data[key].date}</td>
          <td>
            <button type="button" class="btn btn-primary update-btn" data-id="${key}">編輯</button>
            <button type="button" class="btn btn-danger delete-btn" data-id="${key}">刪除</button>
          </td>
        </tr>
        `;
      });
      document.querySelector('#data-table').innerHTML = str;
      updateBtnListener();
      deleteBtnListener();
    };
  }); 
}

function readFormData() {
  // return array within every parameter element
  const params = window.location.search.replace('?', '').split('&');
  console.log(params);
  const addFormRef = document.querySelector('#add-form');
  // handle chinese decode
  addFormRef.title.value = decodeURI(params[1].split('=')[1]);
  addFormRef.type.value = params[2].split('=')[1];
  addFormRef.number.value = params[3].split('=')[1];
  addFormRef.date.value = params[4].split('=')[1];
}

function updateData(id, title, type, number, date) {
  const accountRef = database.ref('account/' + id);
  accountRef.update({
    title: title,
    type: type,
    number: number,
    date: date
  });
  accountRef.on('value', function(snapshot) {
    console.log('successfully update');
    window.location = '/';
  });
}

function deleteData(id) {
  const accountRef = database.ref('account/' + id);
  accountRef.remove();
  accountRef.on('value', function(snapshot) {
    console.log('successfully delete');
    window.location = '/';
  });  
}

function submitListener(submitType) {
  const addFormRef = document.querySelector('#add-form');
  addFormRef.addEventListener('submit', function(e) {
    e.preventDefault();

    // Generate RFC4122 version 4 UUIDs
    const id = uuid.v4();
    const title = addFormRef.title.value;
    const type = addFormRef.type.value;
    const number = addFormRef.number.value;
    const date = addFormRef.date.value;

    if (submitType === 'create') {
      writeAccountData(id, title, type, number, date);
    } else {
      const params = window.location.search.replace('?', '').split('&');
      const id = params[0].split('=')[1];
      updateData(id, title, type, number, date);
    }
  });
}

function updateBtnListener() {
  const updateBtns = document.querySelectorAll('.update-btn');
  console.log(updateBtns);
  for (let i = 0; i < updateBtns.length; i++) {
    updateBtns[i].addEventListener('click', function(e) {
      const id = updateBtns[i].getAttribute('data-id');
      e.preventDefault();
      const accountRef = database.ref('account/' + id);
      accountRef.on('value', function(snapshot) {
        window.location = '/edit.html?id=' + id + '&title=' + snapshot.val().title + '&type=' + snapshot.val().type + '&number=' + snapshot.val().number + '&date=' + snapshot.val().date;
      });
    });
  }
}

function deleteBtnListener() {
  const deleteBtns = document.querySelectorAll('.delete-btn');
  console.log(deleteBtns);
  for (let i = 0; i < deleteBtns.length; i++) {
    deleteBtns[i].addEventListener('click', function(e) {
      const id = deleteBtns[i].getAttribute('data-id');
      e.preventDefault();
      if (confirm('確定刪除？')) {
        deleteData(id);
      } else {
        alert('取消刪除');
      }
    });
  } 
}

function loadChart(rawData) {
  let eat = 0;
  let life = 0;
  let play = 0;
  let edu = 0;
  let trafic = 0;
  let others = 0;
  const ctxRef = document.querySelector('#data-chart');
  const infoRef = document.querySelector('#data-chart-info');

  // use for /in loop to filter non necessary object
  for (const key in rawData) {
    if (rawData.hasOwnProperty(key)) {
      const type = rawData[key].type;
      const number = rawData[key].number;

      switch(type) {
        case 'eat':
          eat += parseInt(number);
          break;
        case 'life':
          life += parseInt(number);
          break;
        case 'play':
          play += parseInt(number);
          break;
        case 'edu':
          edu += parseInt(number);
          break;
        case 'trafic':
          trafic += parseInt(number);
          break;
        case 'others':
          others += parseInt(number);
          break;
      }
    }
  }

  const data = {
    labels: [
      '餐費',
      '生活',
      '娛樂',
      '教育',
      '交通',
      '其他'
    ],
    datasets: [{
      data: [eat, life, play, edu, trafic, others],
      backgroundColor: [
        'rgba(255, 99, 132, 0.5)',
        'rgba(54, 162, 235, 0.5)',
        'rgba(255, 206, 86, 0.5)',
        'rgba(75, 192, 192, 0.5)',
        'rgba(153, 102, 255, 0.5)',
        'rgba(255, 159, 64, 0.5)'
      ],
      borderColor: [
        'rgba(255, 99, 132, 1)',
        'rgba(54, 162, 235, 1)',
        'rgba(255, 206, 86, 1)',
        'rgba(75, 192, 192, 1)',
        'rgba(153, 102, 255, 1)',
        'rgba(255, 159, 64, 1)'
      ]
    }]
  };

  const pieChart = new Chart(ctxRef, {
    type: 'pie',
    data: data
  }); 
}

const path = window.location.pathname;

switch(path) {
  case '/new.html':
    submitListener('create');
    break;
  case '/edit.html':
    readFormData();
    submitListener('update');
    break;
  default:
    readAccountDate();
    break;
}
