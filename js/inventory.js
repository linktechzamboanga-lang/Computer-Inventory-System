const API_URL = "https://script.google.com/macros/s/AKfycbw1lr0ZKy5CLKnwH-WjeIg5QnYxX5vf3Guli4YkGDk8CNpg1vuzTZHi-7WAVcSDzE9Rjg/exec";

let currentUser = null;

// LOGIN
document.getElementById("loginForm").addEventListener("submit", login);

async function login(e){
  e.preventDefault();

  const username = loginUsername.value.trim();
  const password = loginPassword.value;

  loginButton.disabled = true;

  const res = await fetch(API_URL,{
    method:"POST",
    headers:{"Content-Type":"text/plain"},
    body:JSON.stringify({
      action:"login",
      username,
      password
    })
  });

  const data = await res.json();
  loginButton.disabled = false;

  if(!data.success){
    loginError.style.display="flex";
    loginErrorText.textContent=data.message;
    return;
  }

  currentUser = data.user;

  headerEmployeeName.textContent = currentUser.EmployeeName;
  headerUserRole.textContent = currentUser.Role;
  sidebarEmployeeName.textContent = currentUser.EmployeeName;
  sidebarUserRole.textContent = currentUser.Role;
  welcomeEmployee.textContent = currentUser.EmployeeName;

  loginScreen.style.display="none";
  appContainer.style.display="flex";

  loadDashboard();
}

// LOGOUT
logoutButton.onclick = ()=>{
  currentUser = null;
  appContainer.style.display="none";
  loginScreen.style.display="flex";
};

// NAVIGATION
document.querySelectorAll(".nav-item").forEach(btn=>{
  btn.onclick = ()=>{
    document.querySelectorAll(".nav-item").forEach(x=>x.classList.remove("active"));
    btn.classList.add("active");

    document.querySelectorAll(".content-section").forEach(x=>x.classList.remove("active-section"));
    document.getElementById(btn.dataset.section).classList.add("active-section");
  };
});

/* =========================================================
   PART 3B - INVENTORY CRUD
   Matches the new index.html
========================================================= */

let inventoryData = [];
let editingComputerID = null;

/* =========================
   LOAD INVENTORY
========================= */

async function loadInventory(){

  const res = await fetch(`${API_URL}?action=getInventory`);
  const data = await res.json();

  inventoryData = data.inventory || [];

  renderInventoryTable(inventoryData);
  updateDashboardCards();

}

/* =========================
   RENDER TABLE
========================= */

function renderInventoryTable(list){

  inventoryTableBody.innerHTML="";

  inventoryRecordCount.textContent =
      `${list.length} records`;

  list.forEach(item=>{

    inventoryTableBody.innerHTML += `

    <tr>

      <td>${item.ComputerID}</td>
      <td>${item.ControlNumber}</td>
      <td>${item.CustodianName}</td>
      <td>${item.Department}</td>
      <td>${item.ItemType}</td>
      <td>${item.ItemDescriptions}</td>
      <td>${item.Brand}</td>
      <td>${item.Model}</td>
      <td>${item.SerialNumber}</td>
      <td>${item.PurchaseDate}</td>
      <td>${item.Location}</td>

      <td>
        <span class="status ${item.Status.toLowerCase()}">
          ${item.Status}
        </span>
      </td>

      <td>${item.ProblemComplaint}</td>
      <td>${item.Recommendation}</td>
      <td>${item["DatePull-out"]}</td>
      <td>${item.DateReturn}</td>
      <td>${item.PlaceAT}</td>
      <td>${item.Remarks}</td>
      <td>${item.licensedwindow}</td>
      <td>${item.licensedSecurity}</td>
      <td>${item.Checkedby}</td>
      <td>${item.DateCleanUp}</td>
      <td>${item.Scheduled}</td>
      <td>${item.DateRequest}</td>
      <td>${item.DateCheckup}</td>

      <td>

        <button
          class="edit-btn"
          onclick="editInventory('${item.ComputerID}')">
          Edit
        </button>

        <button
          class="delete-btn"
          onclick="confirmDeleteInventory('${item.ComputerID}')">
          Delete
        </button>

      </td>

    </tr>

    `;

  });

}

/* =========================
   DASHBOARD COUNTERS
========================= */

function updateDashboardCards(){

  totalComputers.textContent =
      inventoryData.length;

  workingComputers.textContent =
      inventoryData.filter(x=>x.Status==="Working").length;

  maintenanceComputers.textContent =
      inventoryData.filter(x=>x.Status==="Maintenance").length;

  pulloutComputers.textContent =
      inventoryData.filter(x=>x.Status==="Pull-out").length;

}

/* =========================
   OPEN ADD MODAL
========================= */

addInventoryButton.onclick=()=>{

  editingComputerID=null;

  inventoryForm.reset();

  inventoryModalTitle.textContent="Add Computer";

  inventoryModal.style.display="flex";

};

/* =========================
   CLOSE MODAL
========================= */

document.querySelectorAll("[data-close-modal]").forEach(btn=>{

  btn.onclick=()=>{

    document.getElementById(
      btn.dataset.closeModal
    ).style.display="none";

  };

});

/* =========================
   SAVE INVENTORY
========================= */

inventoryForm.addEventListener("submit",saveInventory);

async function saveInventory(e){

  e.preventDefault();

  const payload={

    ComputerID: inventoryComputerID.value,

    ControlNumber: inventoryControlNumber.value,
    CustodianName: inventoryCustodianName.value,
    Department: inventoryDepartment.value,
    ItemType: inventoryItemType.value,
    ItemDescriptions: inventoryItemDescriptions.value,

    Brand: inventoryBrand.value,
    Model: inventoryModel.value,
    SerialNumber: inventorySerialNumber.value,
    PurchaseDate: inventoryPurchaseDate.value,

    Location: inventoryLocation.value,
    Status: inventoryStatus.value,

    ProblemComplaint: inventoryProblemComplaint.value,
    Recommendation: inventoryRecommendation.value,

    "DatePull-out": inventoryDatePullout.value,

    DateReturn: inventoryDateReturn.value,
    PlaceAT: inventoryPlaceAT.value,
    Remarks: inventoryRemarks.value,

    licensedwindow:
      inventoryLicensedWindows.checked?"Licensed":"",

    licensedSecurity:
      inventoryLicensedSecurity.checked?"Licensed":"",

    Checkedby: inventoryCheckedby.value,
    DateCleanUp: inventoryDateCleanUp.value,
    Scheduled: inventoryScheduled.value,
    DateRequest: inventoryDateRequest.value,
    DateCheckup: inventoryDateCheckup.value

  };

  const action =
      editingComputerID
      ?"updateInventory"
      :"createInventory";

  const res=await fetch(API_URL,{

    method:"POST",

    headers:{
      "Content-Type":"text/plain"
    },

    body:JSON.stringify({
      action,
      data:payload,
      ComputerID:editingComputerID
    })

  });

  const result=await res.json();

  if(!result.success){
    alert(result.message);
    return;
  }

  inventoryModal.style.display="none";

  loadInventory();

}

/* =========================
   EDIT
========================= */

function editInventory(id){

  editingComputerID=id;

  const item=
      inventoryData.find(x=>x.ComputerID===id);

  if(!item) return;

  inventoryModalTitle.textContent="Edit Computer";

  inventoryComputerID.value=item.ComputerID;

  inventoryControlNumber.value=item.ControlNumber;
  inventoryCustodianName.value=item.CustodianName;
  inventoryDepartment.value=item.Department;
  inventoryItemType.value=item.ItemType;
  inventoryItemDescriptions.value=item.ItemDescriptions;

  inventoryBrand.value=item.Brand;
  inventoryModel.value=item.Model;
  inventorySerialNumber.value=item.SerialNumber;
  inventoryPurchaseDate.value=item.PurchaseDate;

  inventoryLocation.value=item.Location;
  inventoryStatus.value=item.Status;

  inventoryProblemComplaint.value=item.ProblemComplaint;
  inventoryRecommendation.value=item.Recommendation;

  inventoryDatePullout.value=item["DatePull-out"];
  inventoryDateReturn.value=item.DateReturn;

  inventoryPlaceAT.value=item.PlaceAT;
  inventoryRemarks.value=item.Remarks;

  inventoryLicensedWindows.checked=
      item.licensedwindow==="Licensed";

  inventoryLicensedSecurity.checked=
      item.licensedSecurity==="Licensed";

  inventoryCheckedby.value=item.Checkedby;
  inventoryDateCleanUp.value=item.DateCleanUp;
  inventoryScheduled.value=item.Scheduled;
  inventoryDateRequest.value=item.DateRequest;
  inventoryDateCheckup.value=item.DateCheckup;

  inventoryModal.style.display="flex";

}

/* =========================
   DELETE
========================= */

let deleteInventoryID="";

function confirmDeleteInventory(id){

  deleteInventoryID=id;

  deleteMessage.textContent=
      `Delete Computer ID: ${id}?`;

  deleteModal.style.display="flex";

}

confirmDeleteButton.onclick=async()=>{

  const res=await fetch(API_URL,{

    method:"POST",

    headers:{
      "Content-Type":"text/plain"
    },

    body:JSON.stringify({

      action:"deleteInventory",

      ComputerID:deleteInventoryID

    })

  });

  const result=await res.json();

  if(result.success){

    deleteModal.style.display="none";

    loadInventory();

  }else{

    alert(result.message);

  }

};

/* =========================
   SEARCH INVENTORY
========================= */

inventorySearch.onkeyup=()=>{

  const keyword=
      inventorySearch.value.toLowerCase();

  const filtered=
      inventoryData.filter(item=>

        item.ControlNumber.toLowerCase().includes(keyword) ||

        item.CustodianName.toLowerCase().includes(keyword) ||

        item.Department.toLowerCase().includes(keyword) ||

        item.Brand.toLowerCase().includes(keyword) ||

        item.SerialNumber.toLowerCase().includes(keyword)

      );

  renderInventoryTable(filtered);

};

/* =========================================================
   PART 3C
   REQUESTS + SCHEDULE + PRINT + EXPORT + AI HELPER
========================================================= */

let requestData = [];
let scheduleData = [];

let editingRequestID = null;
let editingScheduleID = null;

/* =========================================================
   LOAD REQUESTS
========================================================= */

async function loadRequests(){

    const res = await fetch(
        `${API_URL}?action=getRequests`
    );

    const data = await res.json();

    requestData = data.requests || [];

    renderRequestTable(requestData);

    totalRequests.textContent =
        requestData.length;

}

/* =========================================================
   REQUEST TABLE
========================================================= */

function renderRequestTable(list){

    requestTableBody.innerHTML = "";

    requestRecordCount.textContent =
        `${list.length} records`;

    list.forEach(item=>{

        requestTableBody.innerHTML += `

        <tr>

            <td>${item.ID}</td>
            <td>${item.ControlNumber}</td>
            <td>${item.CustodianName}</td>
            <td>${item.Department}</td>
            <td>${item.ItemType}</td>
            <td>${item.Quantity}</td>
            <td>${item.ItemDescriptions}</td>
            <td>${item.Brand}</td>
            <td>${item.Location}</td>
            <td>${item.DateRequest}</td>
            <td>${item.Status}</td>
            <td>${item.ProofDocument || ""}</td>

            <td>

                <button
                    class="edit-btn"
                    onclick="editRequest('${item.ID}')">
                    Edit
                </button>

                <button
                    class="delete-btn"
                    onclick="deleteRequest('${item.ID}')">
                    Delete
                </button>

            </td>

        </tr>

        `;

    });

}

/* =========================================================
   ADD REQUEST
========================================================= */

addRequestButton.onclick = ()=>{

    editingRequestID = null;

    requestForm.reset();

    requestModalTitle.textContent =
        "Add Request";

    requestModal.style.display="flex";

};

/* =========================================================
   SAVE REQUEST
========================================================= */

requestForm.addEventListener(
    "submit",
    saveRequest
);

async function saveRequest(e){

    e.preventDefault();

    const payload = {

        ID: requestID.value,

        ControlNumber:
            requestControlNumber.value,

        CustodianName:
            requestCustodianName.value,

        Department:
            requestDepartment.value,

        ItemType:
            requestItemType.value,

        Quantity:
            requestQuantity.value,

        ItemDescriptions:
            requestItemDescriptions.value,

        Brand:
            requestBrand.value,

        Location:
            requestLocation.value,

        DateRequest:
            requestDateRequest.value,

        Status:
            requestStatus.value,

        ProofDocument:
            requestProofDocument.value

    };

    const action =
        editingRequestID
        ? "updateRequest"
        : "createRequest";

    const res = await fetch(API_URL,{

        method:"POST",

        headers:{
            "Content-Type":"text/plain"
        },

        body:JSON.stringify({

            action,
            ID: editingRequestID,
            data: payload

        })

    });

    const result = await res.json();

    if(result.success){

        requestModal.style.display="none";

        loadRequests();

    }

}

/* =========================================================
   EDIT REQUEST
========================================================= */

function editRequest(id){

    editingRequestID = id;

    const item =
        requestData.find(
            x=>x.ID===id
        );

    if(!item) return;

    requestID.value = item.ID;

    requestControlNumber.value =
        item.ControlNumber;

    requestCustodianName.value =
        item.CustodianName;

    requestDepartment.value =
        item.Department;

    requestItemType.value =
        item.ItemType;

    requestQuantity.value =
        item.Quantity;

    requestItemDescriptions.value =
        item.ItemDescriptions;

    requestBrand.value =
        item.Brand;

    requestLocation.value =
        item.Location;

    requestDateRequest.value =
        item.DateRequest;

    requestStatus.value =
        item.Status;

    requestProofDocument.value =
        item.ProofDocument;

    requestModalTitle.textContent =
        "Edit Request";

    requestModal.style.display="flex";

}

/* =========================================================
   DELETE REQUEST
========================================================= */

async function deleteRequest(id){

    if(!confirm(
        "Delete request?"
    )) return;

    await fetch(API_URL,{

        method:"POST",

        headers:{
            "Content-Type":"text/plain"
        },

        body:JSON.stringify({

            action:"deleteRequest",
            ID:id

        })

    });

    loadRequests();

}

/* =========================================================
   REQUEST SEARCH
========================================================= */

requestSearch.onkeyup = ()=>{

    const keyword =
        requestSearch.value.toLowerCase();

    const filtered =
        requestData.filter(item=>

            item.ControlNumber
            .toLowerCase()
            .includes(keyword)

            ||

            item.CustodianName
            .toLowerCase()
            .includes(keyword)

            ||

            item.Department
            .toLowerCase()
            .includes(keyword)

        );

    renderRequestTable(filtered);

};

/* =========================================================
   LOAD SCHEDULE
========================================================= */

async function loadSchedules(){

    const res = await fetch(
        `${API_URL}?action=getSchedules`
    );

    const data = await res.json();

    scheduleData =
        data.schedules || [];

    renderScheduleTable(scheduleData);

}

/* =========================================================
   SCHEDULE TABLE
========================================================= */

function renderScheduleTable(list){

    scheduleTableBody.innerHTML="";

    scheduleRecordCount.textContent =
        `${list.length} records`;

    list.forEach(item=>{

        scheduleTableBody.innerHTML += `

        <tr>

            <td>${item.ID}</td>
            <td>${item.Branch}</td>
            <td>${item.DateStart}</td>
            <td>${item.DateEnd}</td>
            <td>${item.Days}</td>
            <td>${item.TypeSchedule}</td>
            <td>${item.Purpose}</td>
            <td>${item.AsignPersonel}</td>
            <td>${item.TaskAccomplishment}</td>

            <td>

                <button
                    class="edit-btn"
                    onclick="editSchedule('${item.ID}')">
                    Edit
                </button>

                <button
                    class="delete-btn"
                    onclick="deleteSchedule('${item.ID}')">
                    Delete
                </button>

            </td>

        </tr>

        `;

    });

}

/* =========================================================
   ADD SCHEDULE
========================================================= */

addScheduleButton.onclick = ()=>{

    editingScheduleID = null;

    scheduleForm.reset();

    scheduleModalTitle.textContent =
        "Add Schedule";

    scheduleModal.style.display="flex";

};

/* =========================================================
   SAVE SCHEDULE
========================================================= */

scheduleForm.addEventListener(
    "submit",
    saveSchedule
);

async function saveSchedule(e){

    e.preventDefault();

    const payload = {

        ID: scheduleID.value,

        Branch:
            scheduleBranch.value,

        DateStart:
            scheduleDateStart.value,

        DateEnd:
            scheduleDateEnd.value,

        Days:
            scheduleDays.value,

        TypeSchedule:
            scheduleTypeSchedule.value,

        Purpose:
            schedulePurpose.value,

        AsignPersonel:
            scheduleAsignPersonel.value,

        TaskAccomplishment:
            scheduleTaskAccomplishment.value

    };

    const action =
        editingScheduleID
        ? "updateSchedule"
        : "createSchedule";

    const res = await fetch(API_URL,{

        method:"POST",

        headers:{
            "Content-Type":"text/plain"
        },

        body:JSON.stringify({

            action,
            ID: editingScheduleID,
            data: payload

        })

    });

    const result = await res.json();

    if(result.success){

        scheduleModal.style.display="none";

        loadSchedules();

    }

}

/* =========================================================
   EDIT SCHEDULE
========================================================= */

function editSchedule(id){

    editingScheduleID=id;

    const item =
        scheduleData.find(
            x=>x.ID===id
        );

    if(!item) return;

    scheduleID.value =
        item.ID;

    scheduleBranch.value =
        item.Branch;

    scheduleDateStart.value =
        item.DateStart;

    scheduleDateEnd.value =
        item.DateEnd;

    scheduleDays.value =
        item.Days;

    scheduleTypeSchedule.value =
        item.TypeSchedule;

    schedulePurpose.value =
        item.Purpose;

    scheduleAsignPersonel.value =
        item.AsignPersonel;

    scheduleTaskAccomplishment.value =
        item.TaskAccomplishment;

    scheduleModalTitle.textContent =
        "Edit Schedule";

    scheduleModal.style.display="flex";

}

/* =========================================================
   DELETE SCHEDULE
========================================================= */

async function deleteSchedule(id){

    if(!confirm(
        "Delete schedule?"
    )) return;

    await fetch(API_URL,{

        method:"POST",

        headers:{
            "Content-Type":"text/plain"
        },

        body:JSON.stringify({

            action:"deleteSchedule",
            ID:id

        })

    });

    loadSchedules();

}

/* =========================================================
   SCHEDULE SEARCH
========================================================= */

scheduleSearch.onkeyup = ()=>{

    const keyword =
        scheduleSearch.value.toLowerCase();

    const filtered =
        scheduleData.filter(item=>

            item.Branch
            .toLowerCase()
            .includes(keyword)

            ||

            item.TypeSchedule
            .toLowerCase()
            .includes(keyword)

            ||

            item.AsignPersonel
            .toLowerCase()
            .includes(keyword)

        );

    renderScheduleTable(filtered);

};

/* =========================================================
   PRINT
========================================================= */

printInventoryButton.onclick =
    ()=>window.print();

printRequestButton.onclick =
    ()=>window.print();

printScheduleButton.onclick =
    ()=>window.print();

/* =========================================================
   CSV EXPORT
========================================================= */

function exportCSV(filename,data){

    if(!data.length) return;

    const headers =
        Object.keys(data[0]);

    const csv = [

        headers.join(","),

        ...data.map(row=>

            headers.map(h=>

                `"${row[h] ?? ""}"`

            ).join(",")

        )

    ].join("\n");

    const blob =
        new Blob(
            [csv],
            {type:"text/csv"}
        );

    const url =
        URL.createObjectURL(blob);

    const a =
        document.createElement("a");

    a.href=url;

    a.download=filename;

    a.click();

}

/* EXPORT BUTTONS */

downloadInventoryButton.onclick=
()=>exportCSV(
    "Inventory.csv",
    inventoryData
);

downloadRequestButton.onclick=
()=>exportCSV(
    "Requests.csv",
    requestData
);

downloadScheduleButton.onclick=
()=>exportCSV(
    "Schedules.csv",
    scheduleData
);

/* =========================================================
   AI HELPER
========================================================= */

generateAIButton.onclick=()=>{

    const working =
        inventoryData.filter(
            x=>x.Status==="Working"
        ).length;

    const maintenance =
        inventoryData.filter(
            x=>x.Status==="Maintenance"
        ).length;

    const pullout =
        inventoryData.filter(
            x=>x.Status==="Pull-out"
        ).length;

    const defective =
        inventoryData.filter(
            x=>x.Status==="Defective"
        ).length;

    aiReportOutput.innerHTML = `

    <h3>Inventory Analysis Report</h3>

    <p>
    Total Computers:
    <b>${inventoryData.length}</b>
    </p>

    <p>
    Working:
    <b>${working}</b>
    </p>

    <p>
    Maintenance:
    <b>${maintenance}</b>
    </p>

    <p>
    Pull-out:
    <b>${pullout}</b>
    </p>

    <p>
    Defective:
    <b>${defective}</b>
    </p>

    <hr>

    <h4>Recommendation</h4>

    <p>
    Prioritize maintenance of
    defective and pull-out units.
    Schedule preventive maintenance
    for all active computers.
    Review aging equipment for
    replacement planning.
    </p>

    `;

};

/* =========================================================
   REPORT BUTTONS
========================================================= */

generateInventoryReportButton.onclick =
()=> exportCSV(
    "Inventory_Report.csv",
    inventoryData
);

generateRequestReportButton.onclick =
()=> exportCSV(
    "Request_Report.csv",
    requestData
);

generateScheduleReportButton.onclick =
()=> exportCSV(
    "Schedule_Report.csv",
    scheduleData
);

/* =========================================================
   INITIAL LOAD
========================================================= */

async function loadDashboard(){

    await loadInventory();

    await loadRequests();

    await loadSchedules();

}

