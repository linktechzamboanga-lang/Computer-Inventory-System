/* =========================================================
   COMPUTER INVENTORY SYSTEM
   inventory.js
   PART 3A OF 3
   Configuration + Dashboard + Charts + Search
========================================================= */


/* ==========================
   GOOGLE APPS SCRIPT URL
========================== */

const API_URL = "https://script.google.com/macros/s/AKfycbxvCgXKgDts7IYyUUFfaXhZxR6cAVfrY8YCfeKRo0QlN9B9ICqV9yAa-Qpr8DKpscmi1w/exec";


/* ==========================
   GLOBAL VARIABLES
========================== */

let inventoryData = [];
let requestData = [];
let scheduleData = [];

let typeChart = null;
let statusChart = null;


/* ==========================
   INITIALIZE
========================== */

document.addEventListener("DOMContentLoaded", () => {

    loadDashboard();
    loadInventory();

});


/* ==========================
   SIDEBAR NAVIGATION
========================== */

function showSection(sectionId){

    document.querySelectorAll(".content-section")
    .forEach(sec=>sec.classList.remove("active"));

    document.getElementById(sectionId)
    .classList.add("active");

    document.querySelectorAll(".sidebar li")
    .forEach(li=>li.classList.remove("active"));

    event.target.classList.add("active");


    if(sectionId==="inventory"){
        loadInventory();
    }

    if(sectionId==="request"){
        loadRequests();
    }

    if(sectionId==="schedule"){
        loadSchedule();
    }

}


/* ==========================
   LOAD DASHBOARD
========================== */

async function loadDashboard(){

    try{

        const year=document.getElementById("filterYear").value;
        const month=document.getElementById("filterMonth").value;
        const week=document.getElementById("filterWeek").value;

        const res=await fetch(
            `${API_URL}?action=getDashboard&year=${year}&month=${month}&week=${week}`
        );

        const data=await res.json();

        inventoryData=data.inventory || [];

        updateCards(inventoryData);

        createCharts(inventoryData);

    }catch(err){

        console.error(err);

        alert("Dashboard loading failed.");

    }

}


/* ==========================
   DASHBOARD CARDS
========================== */

function updateCards(data){

    const total=data.length;

    const working=
    data.filter(r=>r.Status==="Working").length;

    const maintenance=
    data.filter(r=>r.Status==="Maintenance").length;

    const pullout=
    data.filter(r=>r.Status==="Pull-out").length;

    document.getElementById("totalComputers").innerText=total;

    document.getElementById("workingCount").innerText=working;

    document.getElementById("maintenanceCount").innerText=maintenance;

    document.getElementById("pulloutCount").innerText=pullout;

}


/* ==========================
   CHARTS
========================== */

function createCharts(data){

    const typeCounts={};
    const statusCounts={};

    data.forEach(item=>{

        const type=item.ItemType || "Others";

        const status=item.Status || "Unknown";

        typeCounts[type]=(typeCounts[type]||0)+1;

        statusCounts[status]=(statusCounts[status]||0)+1;

    });


    if(typeChart){
        typeChart.destroy();
    }

    if(statusChart){
        statusChart.destroy();
    }


    typeChart=new Chart(
        document.getElementById("typeChart"),
        {
            type:"doughnut",
            data:{
                labels:Object.keys(typeCounts),
                datasets:[{
                    data:Object.values(typeCounts),
                    backgroundColor:[
                        "#2563eb",
                        "#7c3aed",
                        "#16a34a",
                        "#f59e0b",
                        "#ec4899"
                    ]
                }]
            },
            options:{
                responsive:true,
                plugins:{
                    legend:{
                        position:"bottom"
                    }
                }
            }
        }
    );


    statusChart=new Chart(
        document.getElementById("statusChart"),
        {
            type:"bar",
            data:{
                labels:Object.keys(statusCounts),
                datasets:[{
                    label:"Units",
                    data:Object.values(statusCounts),
                    backgroundColor:[
                        "#16a34a",
                        "#f59e0b",
                        "#dc2626",
                        "#64748b"
                    ],
                    borderRadius:8
                }]
            },
            options:{
                responsive:true,
                scales:{
                    y:{
                        beginAtZero:true
                    }
                }
            }
        }
    );

}


/* ==========================
   LOAD INVENTORY
========================== */

async function loadInventory(){

    try{

        const res=await fetch(
            `${API_URL}?action=getInventory`
        );

        const data=await res.json();

        inventoryData=data.inventory || [];

        renderInventoryTable(inventoryData);

    }catch(err){

        console.error(err);

    }

}


/* ==========================
   RENDER INVENTORY TABLE
========================== */

function renderInventoryTable(data){

    const tbody=document.getElementById("inventoryBody");

    tbody.innerHTML="";

    data.forEach(item=>{

        const tr=document.createElement("tr");

        tr.innerHTML=`

        <td>${item.ControlNumber}</td>

        <td>${item.CustodianName}</td>

        <td>${item.Department}</td>

        <td>${item.ItemType}</td>

        <td>${item.Brand}</td>

        <td>
            <span class="badge badge-${getStatusClass(item.Status)}">
                ${item.Status}
            </span>
        </td>

        <td>

            <button onclick="editInventory('${item.ComputerID}')">
            Edit
            </button>

            <button onclick="deleteInventory('${item.ComputerID}')">
            Delete
            </button>

        </td>

        `;

        tbody.appendChild(tr);

    });

}


/* ==========================
   SEARCH INVENTORY
========================== */

function searchInventory(){

    const keyword=document
    .getElementById("searchInput")
    .value
    .toLowerCase();

    const filtered=inventoryData.filter(item=>{

        return(

            String(item.ControlNumber)
            .toLowerCase()
            .includes(keyword)

            ||

            String(item.CustodianName)
            .toLowerCase()
            .includes(keyword)

            ||

            String(item.SerialNumber)
            .toLowerCase()
            .includes(keyword)

            ||

            String(item.Brand)
            .toLowerCase()
            .includes(keyword)

            ||

            String(item.Department)
            .toLowerCase()
            .includes(keyword)

        );

    });

    renderInventoryTable(filtered);

}


/* ==========================
   STATUS BADGE COLOR
========================== */

function getStatusClass(status){

    switch(status){

        case "Working":
            return "working";

        case "Maintenance":
            return "maintenance";

        case "Pull-out":
            return "pullout";

        default:
            return "working";

    }

}


/* ==========================
   LOGOUT
========================== */

function logout(){

    if(confirm("Logout from system?")){

        location.reload();

    }

}


/* =========================================================
   COMPUTER INVENTORY SYSTEM
   inventory.js
   PART 3B
   INVENTORY CRUD
========================================================= */


/* =========================================================
   INVENTORY FORM STATE
========================================================= */

let editingComputerID = null;


/* =========================================================
   OPEN INVENTORY MODAL
========================================================= */

function openModal(computerID = null){

    const modal = document.getElementById("inventoryModal");

    if(!modal){
        console.error("Inventory modal was not found.");
        return;
    }

    editingComputerID = computerID;

    clearInventoryForm();

    if(computerID){

        const item = inventoryData.find(
            record => String(record.ComputerID) === String(computerID)
        );

        if(!item){

            alert("Inventory record was not found.");

            return;
        }

        populateInventoryForm(item);

        const title = modal.querySelector(".modal-header h2");

        if(title){
            title.textContent = "Edit Inventory";
        }

    }else{

        const title = modal.querySelector(".modal-header h2");

        if(title){
            title.textContent = "Add Inventory";
        }

        generateComputerID();

    }

    modal.style.display = "flex";

}


/* =========================================================
   CLOSE INVENTORY MODAL
========================================================= */

function closeModal(){

    const modal = document.getElementById("inventoryModal");

    if(modal){
        modal.style.display = "none";
    }

    editingComputerID = null;

    clearInventoryForm();

}


/* =========================================================
   CLOSE MODAL WHEN CLICKING OUTSIDE
========================================================= */

window.addEventListener("click", function(event){

    const modal = document.getElementById("inventoryModal");

    if(event.target === modal){

        closeModal();

    }

});


/* =========================================================
   CLEAR INVENTORY FORM
========================================================= */

function clearInventoryForm(){

    const fields = [

        "computerID",
        "controlNumber",
        "custodianName",
        "department",
        "brand",
        "model",
        "serialNumber",
        "purchaseDate",
        "location",
        "remarks"

    ];

    fields.forEach(id => {

        const element = document.getElementById(id);

        if(element){

            element.value = "";

        }

    });


    const itemType = document.getElementById("itemType");

    if(itemType){

        itemType.value = "Desktop";

    }


    const status = document.getElementById("status");

    if(status){

        status.value = "Working";

    }

}


/* =========================================================
   GENERATE COMPUTER ID
========================================================= */

function generateComputerID(){

    const field = document.getElementById("computerID");

    if(!field){
        return;
    }

    const numbers = inventoryData
        .map(item => {

            const value = String(item.ComputerID || "");

            const match = value.match(/\d+/);

            return match ? parseInt(match[0],10) : 0;

        })
        .filter(number => number > 0);


    const nextNumber =
        numbers.length > 0
            ? Math.max(...numbers) + 1
            : 1;


    field.value =
        "COMP-" +
        String(nextNumber).padStart(5,"0");

}


/* =========================================================
   POPULATE EDIT FORM
========================================================= */

function populateInventoryForm(item){

    setFieldValue("computerID", item.ComputerID);
    setFieldValue("controlNumber", item.ControlNumber);
    setFieldValue("custodianName", item.CustodianName);
    setFieldValue("department", item.Department);
    setFieldValue("itemType", item.ItemType);
    setFieldValue("brand", item.Brand);
    setFieldValue("model", item.Model);
    setFieldValue("serialNumber", item.SerialNumber);
    setFieldValue("purchaseDate", formatDateForInput(item.PurchaseDate));
    setFieldValue("location", item.Location);
    setFieldValue("status", item.Status);
    setFieldValue("remarks", item.Remarks);

}


/* =========================================================
   SAFE FORM VALUE SETTER
========================================================= */

function setFieldValue(id,value){

    const element = document.getElementById(id);

    if(element){

        element.value =
            value === null ||
            value === undefined
                ? ""
                : value;

    }

}


/* =========================================================
   DATE FORMATTER
========================================================= */

function formatDateForInput(value){

    if(!value){
        return "";
    }

    const date = new Date(value);

    if(isNaN(date.getTime())){

        const text = String(value);

        if(/^\d{4}-\d{2}-\d{2}$/.test(text)){

            return text;

        }

        return "";

    }

    const year = date.getFullYear();

    const month =
        String(date.getMonth()+1)
        .padStart(2,"0");

    const day =
        String(date.getDate())
        .padStart(2,"0");

    return `${year}-${month}-${day}`;

}


/* =========================================================
   COLLECT INVENTORY FORM
========================================================= */

function collectInventoryForm(){

    return {

        ComputerID:
            getFieldValue("computerID"),

        ControlNumber:
            getFieldValue("controlNumber"),

        CustodianName:
            getFieldValue("custodianName"),

        Department:
            getFieldValue("department"),

        ItemType:
            getFieldValue("itemType"),

        ItemDescriptions:
            "",

        Brand:
            getFieldValue("brand"),

        Model:
            getFieldValue("model"),

        SerialNumber:
            getFieldValue("serialNumber"),

        PurchaseDate:
            getFieldValue("purchaseDate"),

        Location:
            getFieldValue("location"),

        Status:
            getFieldValue("status"),

        ProblemComplaint:
            "",

        Recommendation:
            "",

        DatePullout:
            "",

        DateReturn:
            "",

        PlaceAT:
            "",

        Remarks:
            getFieldValue("remarks"),

        licensedwindow:
            "",

        licensedSecurity:
            "",

        Checkedby:
            "",

        DateCleanUp:
            "",

        Scheduled:
            "",

        DateRequest:
            "",

        DateCheckup:
            ""

    };

}


/* =========================================================
   GET FIELD VALUE
========================================================= */

function getFieldValue(id){

    const element = document.getElementById(id);

    if(!element){
        return "";
    }

    return String(element.value || "").trim();

}


/* =========================================================
   VALIDATE INVENTORY
========================================================= */

function validateInventory(data){

    const errors = [];

    if(!data.ComputerID){

        errors.push("Computer ID is required.");

    }

    if(!data.ControlNumber){

        errors.push("Control Number is required.");

    }

    if(!data.CustodianName){

        errors.push("Custodian Name is required.");

    }

    if(!data.Department){

        errors.push("Department is required.");

    }

    if(!data.ItemType){

        errors.push("Item Type is required.");

    }

    if(!data.Status){

        errors.push("Status is required.");

    }


    if(errors.length > 0){

        alert(
            "Please correct the following:\n\n" +
            errors.join("\n")
        );

        return false;

    }

    return true;

}


/* =========================================================
   SAVE INVENTORY
========================================================= */

async function saveInventory(){

    const inventory = collectInventoryForm();

    if(!validateInventory(inventory)){

        return;

    }


    const isEditing =
        editingComputerID !== null &&
        editingComputerID !== "";


    const action =
        isEditing
            ? "updateInventory"
            : "createInventory";


    const button =
        document.querySelector(".modal-footer button");


    if(button){

        button.disabled = true;

        button.dataset.originalText =
            button.textContent;

        button.textContent =
            isEditing
                ? "Updating..."
                : "Saving...";

    }


    try{

        const response = await fetch(API_URL,{

            method:"POST",

            headers:{
                "Content-Type":"text/plain;charset=utf-8"
            },

            body:JSON.stringify({

                action:action,

                data:inventory,

                ComputerID:
                    isEditing
                        ? editingComputerID
                        : inventory.ComputerID

            })

        });


        if(!response.ok){

            throw new Error(
                `HTTP Error ${response.status}`
            );

        }


        const result = await response.json();


        if(!result.success){

            throw new Error(
                result.message ||
                "Unable to save inventory."
            );

        }


        alert(
            isEditing
                ? "Inventory successfully updated."
                : "Inventory successfully added."
        );


        closeModal();

        await loadInventory();

        await loadDashboard();


    }catch(error){

        console.error(
            "saveInventory():",
            error
        );

        alert(
            "Unable to save inventory.\n\n" +
            error.message
        );


    }finally{

        if(button){

            button.disabled = false;

            button.textContent =
                button.dataset.originalText ||
                "Save";

        }

    }

}


/* =========================================================
   EDIT INVENTORY
========================================================= */

function editInventory(computerID){

    if(!computerID){

        alert("Invalid Computer ID.");

        return;

    }

    openModal(computerID);

}


/* =========================================================
   DELETE INVENTORY
========================================================= */

async function deleteInventory(computerID){

    if(!computerID){

        alert("Invalid Computer ID.");

        return;

    }


    const item = inventoryData.find(
        record =>
            String(record.ComputerID) ===
            String(computerID)
    );


    const controlNumber =
        item?.ControlNumber || computerID;


    const confirmed = confirm(

        "Delete this inventory record?\n\n" +

        "Computer ID: " +
        computerID +
        "\n" +

        "Control Number: " +
        controlNumber +

        "\n\nThis action cannot be undone."

    );


    if(!confirmed){

        return;

    }


    try{

        const response = await fetch(API_URL,{

            method:"POST",

            headers:{
                "Content-Type":"text/plain;charset=utf-8"
            },

            body:JSON.stringify({

                action:"deleteInventory",

                ComputerID:String(computerID)

            })

        });


        if(!response.ok){

            throw new Error(
                `HTTP Error ${response.status}`
            );

        }


        const result =
            await response.json();


        if(!result.success){

            throw new Error(
                result.message ||
                "Unable to delete inventory."
            );

        }


        alert(
            "Inventory record deleted successfully."
        );


        await loadInventory();

        await loadDashboard();


    }catch(error){

        console.error(
            "deleteInventory():",
            error
        );

        alert(
            "Unable to delete inventory.\n\n" +
            error.message
        );

    }

}


/* =========================================================
   ESC KEY CLOSE MODAL
========================================================= */

document.addEventListener(
    "keydown",
    function(event){

        if(event.key !== "Escape"){

            return;

        }

        const modal =
            document.getElementById(
                "inventoryModal"
            );


        if(
            modal &&
            modal.style.display === "flex"
        ){

            closeModal();

        }

    }
);


/* =========================================================
   DUPLICATE CONTROL NUMBER CHECK
========================================================= */

function controlNumberExists(
    controlNumber,
    excludeComputerID = null
){

    const value =
        String(controlNumber || "")
        .trim()
        .toLowerCase();


    if(!value){

        return false;

    }


    return inventoryData.some(item => {

        const sameControl =
            String(item.ControlNumber || "")
            .trim()
            .toLowerCase() === value;


        const sameComputer =
            excludeComputerID !== null &&
            String(item.ComputerID) ===
            String(excludeComputerID);


        return sameControl && !sameComputer;

    });

}


/* =========================================================
   ENHANCED VALIDATION
========================================================= */

function validateUniqueControlNumber(data){

    if(
        controlNumberExists(
            data.ControlNumber,
            editingComputerID
        )
    ){

        alert(
            "The Control Number already exists.\n\n" +
            "Please enter a unique Control Number."
        );

        return false;

    }

    return true;

}


/* =========================================================
   REPLACE VALIDATION USED BY SAVE
========================================================= */

const originalValidateInventory =
    validateInventory;


validateInventory = function(data){

    if(!originalValidateInventory(data)){

        return false;

    }

    if(!validateUniqueControlNumber(data)){

        return false;

    }

    return true;

};


/* =========================================================
   REFRESH ALL INVENTORY DATA
========================================================= */

async function refreshInventoryData(){

    try{

        await loadInventory();

        await loadDashboard();

        alert(
            "Inventory data refreshed successfully."
        );

    }catch(error){

        console.error(error);

        alert(
            "Unable to refresh inventory data."
        );

    }

}


/* =========================================================
   HTML ESCAPE
   Prevents raw HTML from being inserted into table cells.
========================================================= */

function escapeHTML(value){

    if(
        value === null ||
        value === undefined
    ){

        return "";

    }


    return String(value)

        .replace(/&/g,"&amp;")

        .replace(/</g,"&lt;")

        .replace(/>/g,"&gt;")

        .replace(/"/g,"&quot;")

        .replace(/'/g,"&#039;");

}


/* =========================================================
   REPLACE TABLE RENDERER WITH SAFE VERSION
========================================================= */

function renderInventoryTable(data){

    const tbody =
        document.getElementById(
            "inventoryBody"
        );


    if(!tbody){

        return;

    }


    tbody.innerHTML = "";


    if(!Array.isArray(data) || data.length === 0){

        tbody.innerHTML = `

            <tr>

                <td
                    colspan="7"
                    style="
                        text-align:center;
                        padding:35px;
                        color:#64748b;
                    "
                >

                    No inventory records found.

                </td>

            </tr>

        `;

        return;

    }


    data.forEach(item => {

        const tr =
            document.createElement("tr");


        const computerID =
            escapeHTML(item.ComputerID);


        const controlNumber =
            escapeHTML(item.ControlNumber);


        const custodian =
            escapeHTML(item.CustodianName);


        const department =
            escapeHTML(item.Department);


        const itemType =
            escapeHTML(item.ItemType);


        const brand =
            escapeHTML(item.Brand);


        const status =
            escapeHTML(item.Status);


        const statusClass =
            getStatusClass(item.Status);


        tr.innerHTML = `

            <td>
                ${controlNumber}
            </td>

            <td>
                ${custodian}
            </td>

            <td>
                ${department}
            </td>

            <td>
                ${itemType}
            </td>

            <td>
                ${brand}
            </td>

            <td>

                <span
                    class="badge badge-${statusClass}"
                >
                    ${status || "Unknown"}
                </span>

            </td>

            <td>

                <button
                    type="button"
                    onclick="editInventoryById(this)"
                    data-id="${computerID}"
                >
                    Edit
                </button>

                <button
                    type="button"
                    onclick="deleteInventoryById(this)"
                    data-id="${computerID}"
                >
                    Delete
                </button>

            </td>

        `;


        tbody.appendChild(tr);

    });

}


/* =========================================================
   EDIT BUTTON HANDLER
========================================================= */

function editInventoryById(button){

    if(!button){

        return;

    }

    const computerID =
        button.getAttribute("data-id");


    if(!computerID){

        alert(
            "Computer ID is missing."
        );

        return;

    }


    editInventory(
        computerID
    );

}


/* =========================================================
   DELETE BUTTON HANDLER
========================================================= */

function deleteInventoryById(button){

    if(!button){

        return;

    }

    const computerID =
        button.getAttribute("data-id");


    if(!computerID){

        alert(
            "Computer ID is missing."
        );

        return;

    }


    deleteInventory(
        computerID
    );

}


/* =========================================================
   AUTO REFRESH
========================================================= */

let inventoryRefreshTimer = null;


function startInventoryAutoRefresh(){

    if(inventoryRefreshTimer){

        clearInterval(
            inventoryRefreshTimer
        );

    }


    inventoryRefreshTimer =
        setInterval(

            async function(){

                const activeSection =
                    document.querySelector(
                        ".content-section.active"
                    );


                if(
                    activeSection &&
                    activeSection.id ===
                    "inventory"
                ){

                    await loadInventory();

                }

            },

            60000

        );

}


document.addEventListener(
    "DOMContentLoaded",
    function(){

        startInventoryAutoRefresh();

    }
);



/* =========================================================
   COMPUTER INVENTORY SYSTEM
   inventory.js
   PART 3C
   REQUESTS + SCHEDULE + REPORTS + AI
========================================================= */


/* =========================================================
   GENERAL LOADING STATE
========================================================= */

function setLoading(element, message = "Loading..."){

    if(!element){
        return;
    }

    element.innerHTML = `
        <tr>
            <td
                colspan="10"
                style="
                    text-align:center;
                    padding:30px;
                    color:#64748b;
                "
            >
                ${escapeHTML(message)}
            </td>
        </tr>
    `;

}


/* =========================================================
   LOAD REQUESTS
========================================================= */

async function loadRequests(){

    const tbody =
        document.getElementById("requestBody");

    setLoading(
        tbody,
        "Loading equipment requests..."
    );


    try{

        const response = await fetch(
            `${API_URL}?action=getRequests`
        );


        if(!response.ok){

            throw new Error(
                `HTTP Error ${response.status}`
            );

        }


        const result =
            await response.json();


        if(result.success === false){

            throw new Error(
                result.message ||
                "Unable to load requests."
            );

        }


        requestData =
            Array.isArray(result.requests)
                ? result.requests
                : [];


        renderRequests(
            requestData
        );


        updateNotificationCount();


    }catch(error){

        console.error(
            "loadRequests():",
            error
        );


        if(tbody){

            tbody.innerHTML = `

                <tr>

                    <td
                        colspan="10"
                        style="
                            text-align:center;
                            padding:30px;
                            color:#dc2626;
                        "
                    >

                        Unable to load requests.

                    </td>

                </tr>

            `;

        }

    }

}


/* =========================================================
   RENDER REQUESTS
========================================================= */

function renderRequests(data){

    const tbody =
        document.getElementById(
            "requestBody"
        );


    if(!tbody){

        return;

    }


    tbody.innerHTML = "";


    if(!Array.isArray(data) || data.length === 0){

        tbody.innerHTML = `

            <tr>

                <td
                    colspan="10"
                    style="
                        text-align:center;
                        padding:35px;
                        color:#64748b;
                    "
                >

                    No equipment requests found.

                </td>

            </tr>

        `;

        return;

    }


    data.forEach(request => {

        const status =
            String(
                request.Status || "Pending"
            );


        const statusClass =
            getRequestStatusClass(
                status
            );


        const row =
            document.createElement("tr");


        row.innerHTML = `

            <td>
                ${escapeHTML(request.ID)}
            </td>

            <td>
                ${escapeHTML(
                    request.ControlNumber
                )}
            </td>

            <td>
                ${escapeHTML(
                    request.CustodianName
                )}
            </td>

            <td>
                ${escapeHTML(
                    request.Department
                )}
            </td>

            <td>
                ${escapeHTML(
                    request.ItemType
                )}
            </td>

            <td>
                ${escapeHTML(
                    request.Quantity
                )}
            </td>

            <td>
                ${escapeHTML(
                    request.Status ||
                    "Pending"
                )}
            </td>

            <td>
                ${escapeHTML(
                    request.DateRequest
                )}
            </td>

        `;


        tbody.appendChild(row);

    });

}


/* =========================================================
   REQUEST STATUS CLASS
========================================================= */

function getRequestStatusClass(status){

    const value =
        String(status || "")
        .trim()
        .toLowerCase();


    if(
        value === "approved" ||
        value === "completed"
    ){

        return "working";

    }


    if(
        value === "pending" ||
        value === "processing"
    ){

        return "maintenance";

    }


    if(
        value === "rejected" ||
        value === "cancelled"
    ){

        return "pullout";

    }


    return "working";

}


/* =========================================================
   LOAD SCHEDULE
========================================================= */

async function loadSchedule(){

    const tbody =
        document.getElementById(
            "scheduleBody"
        );


    setLoading(
        tbody,
        "Loading maintenance schedule..."
    );


    try{

        const response =
            await fetch(
                `${API_URL}?action=getSchedule`
            );


        if(!response.ok){

            throw new Error(
                `HTTP Error ${response.status}`
            );

        }


        const result =
            await response.json();


        if(result.success === false){

            throw new Error(
                result.message ||
                "Unable to load schedule."
            );

        }


        scheduleData =
            Array.isArray(result.schedule)
                ? result.schedule
                : [];


        renderSchedule(
            scheduleData
        );


    }catch(error){

        console.error(
            "loadSchedule():",
            error
        );


        if(tbody){

            tbody.innerHTML = `

                <tr>

                    <td
                        colspan="10"
                        style="
                            text-align:center;
                            padding:30px;
                            color:#dc2626;
                        "
                    >

                        Unable to load schedule.

                    </td>

                </tr>

            `;

        }

    }

}


/* =========================================================
   RENDER SCHEDULE
========================================================= */

function renderSchedule(data){

    const tbody =
        document.getElementById(
            "scheduleBody"
        );


    if(!tbody){

        return;

    }


    tbody.innerHTML = "";


    if(!Array.isArray(data) || data.length === 0){

        tbody.innerHTML = `

            <tr>

                <td
                    colspan="10"
                    style="
                        text-align:center;
                        padding:35px;
                        color:#64748b;
                    "
                >

                    No schedules found.

                </td>

            </tr>

        `;

        return;

    }


    data.forEach(schedule => {

        const row =
            document.createElement("tr");


        row.innerHTML = `

            <td>
                ${escapeHTML(
                    schedule.Branch
                )}
            </td>

            <td>
                ${escapeHTML(
                    schedule.DateStart
                )}
            </td>

            <td>
                ${escapeHTML(
                    schedule.DateEnd
                )}
            </td>

            <td>
                ${escapeHTML(
                    schedule.AsignPersonel
                )}
            </td>

            <td>
                ${escapeHTML(
                    schedule.Purpose
                )}
            </td>

        `;


        tbody.appendChild(row);

    });

}


/* =========================================================
   NOTIFICATION COUNT
========================================================= */

function updateNotificationCount(){

    const notification =
        document.getElementById(
            "notifCount"
        );


    if(!notification){

        return;

    }


    const pending =
        requestData.filter(
            request => {

                const status =
                    String(
                        request.Status || ""
                    )
                    .trim()
                    .toLowerCase();


                return (
                    status === "pending" ||
                    status === "processing"
                );

            }
        ).length;


    notification.textContent =
        pending;

}


/* =========================================================
   PRINT INVENTORY
========================================================= */

function printInventory(){

    if(
        !Array.isArray(inventoryData) ||
        inventoryData.length === 0
    ){

        alert(
            "There is no inventory data to print."
        );

        return;

    }


    const rows =
        inventoryData.map(item => `

            <tr>

                <td>
                    ${escapeHTML(
                        item.ControlNumber
                    )}
                </td>

                <td>
                    ${escapeHTML(
                        item.CustodianName
                    )}
                </td>

                <td>
                    ${escapeHTML(
                        item.Department
                    )}
                </td>

                <td>
                    ${escapeHTML(
                        item.ItemType
                    )}
                </td>

                <td>
                    ${escapeHTML(
                        item.Brand
                    )}
                </td>

                <td>
                    ${escapeHTML(
                        item.Model
                    )}
                </td>

                <td>
                    ${escapeHTML(
                        item.SerialNumber
                    )}
                </td>

                <td>
                    ${escapeHTML(
                        item.Location
                    )}
                </td>

                <td>
                    ${escapeHTML(
                        item.Status
                    )}
                </td>

            </tr>

        `).join("");


    const printWindow =
        window.open(
            "",
            "_blank",
            "width=1200,height=800"
        );


    if(!printWindow){

        alert(
            "Please allow pop-ups to print the report."
        );

        return;

    }


    printWindow.document.write(`

        <!DOCTYPE html>

        <html>

        <head>

            <title>
                Computer Inventory Report
            </title>

            <style>

                body{
                    font-family:Arial,sans-serif;
                    margin:30px;
                    color:#222;
                }

                h1{
                    text-align:center;
                    margin-bottom:5px;
                }

                .date{
                    text-align:center;
                    color:#666;
                    margin-bottom:25px;
                }

                table{
                    width:100%;
                    border-collapse:collapse;
                    font-size:11px;
                }

                th,
                td{
                    border:1px solid #999;
                    padding:7px;
                    text-align:left;
                }

                th{
                    background:#f1f5f9;
                }

                .footer{
                    margin-top:25px;
                    font-size:11px;
                    color:#666;
                }

                @media print{

                    body{
                        margin:10mm;
                    }

                }

            </style>

        </head>

        <body>

            <h1>
                COMPUTER INVENTORY REPORT
            </h1>

            <div class="date">
                Generated:
                ${escapeHTML(
                    new Date().toLocaleString()
                )}
            </div>

            <table>

                <thead>

                    <tr>

                        <th>Control Number</th>
                        <th>Custodian</th>
                        <th>Department</th>
                        <th>Type</th>
                        <th>Brand</th>
                        <th>Model</th>
                        <th>Serial Number</th>
                        <th>Location</th>
                        <th>Status</th>

                    </tr>

                </thead>

                <tbody>

                    ${rows}

                </tbody>

            </table>

            <div class="footer">

                Computer Inventory System

            </div>

        </body>

        </html>

    `);


    printWindow.document.close();


    printWindow.focus();


    setTimeout(
        function(){

            printWindow.print();

        },
        500
    );

}


/* =========================================================
   DOWNLOAD PDF
========================================================= */

async function downloadPDF(){

    try{

        const year =
            document.getElementById(
                "filterYear"
            )?.value || "";


        const month =
            document.getElementById(
                "filterMonth"
            )?.value || "";


        const week =
            document.getElementById(
                "filterWeek"
            )?.value || "";


        const url =
            `${API_URL}` +
            `?action=generateInventoryPDF` +
            `&year=${encodeURIComponent(year)}` +
            `&month=${encodeURIComponent(month)}` +
            `&week=${encodeURIComponent(week)}`;


        const response =
            await fetch(url);


        if(!response.ok){

            throw new Error(
                `HTTP Error ${response.status}`
            );

        }


        const result =
            await response.json();


        if(result.success === false){

            throw new Error(
                result.message ||
                "Unable to generate PDF."
            );

        }


        if(result.url){

            window.open(
                result.url,
                "_blank"
            );

            return;

        }


        if(result.downloadUrl){

            window.open(
                result.downloadUrl,
                "_blank"
            );

            return;

        }


        alert(
            "The PDF was generated, but no download link was returned."
        );


    }catch(error){

        console.error(
            "downloadPDF():",
            error
        );


        alert(
            "Unable to generate PDF.\n\n" +
            error.message
        );

    }

}


/* =========================================================
   GENERATE MONTHLY REPORT
========================================================= */

async function generateMonthlyReport(){

    const year =
        document.getElementById(
            "filterYear"
        )?.value || "";


    const month =
        document.getElementById(
            "filterMonth"
        )?.value || "";


    const aiPrompt =
        document.getElementById(
            "aiPrompt"
        );


    if(aiPrompt){

        aiPrompt.value =
            `Generate a professional monthly computer inventory report for ${month} ${year}. Include total inventory, computer types, working units, maintenance units, pull-out units, major problems, recommendations, and management action items.`;

    }


    showSection("ai");


    if(typeof generateAIReport === "function"){

        await generateAIReport();

    }

}


/* =========================================================
   AI REPORT
========================================================= */

async function generateAIReport(){

    const promptElement =
        document.getElementById(
            "aiPrompt"
        );


    const resultElement =
        document.getElementById(
            "aiResult"
        );


    if(!promptElement || !resultElement){

        return;

    }


    const prompt =
        String(
            promptElement.value || ""
        ).trim();


    if(!prompt){

        alert(
            "Please enter a report request first."
        );

        promptElement.focus();

        return;

    }


    resultElement.innerHTML = `

        <div style="
            display:flex;
            align-items:center;
            gap:10px;
        ">

            <span>
                🤖
            </span>

            <span>
                Generating inventory report...
            </span>

        </div>

    `;


    try{

        const response =
            await fetch(
                API_URL,
                {

                    method:"POST",

                    headers:{
                        "Content-Type":
                            "text/plain;charset=utf-8"
                    },

                    body:JSON.stringify({

                        action:
                            "generateAIReport",

                        prompt:prompt

                    })

                }
            );


        if(!response.ok){

            throw new Error(
                `HTTP Error ${response.status}`
            );

        }


        const result =
            await response.json();


        if(result.success === false){

            throw new Error(
                result.message ||
                "AI report generation failed."
            );

        }


        const report =
            result.report ||
            result.result ||
            result.message ||
            "No report was returned.";


        resultElement.textContent =
            report;


    }catch(error){

        console.error(
            "generateAIReport():",
            error
        );


        resultElement.innerHTML = `

            <div style="
                color:#dc2626;
                line-height:1.7;
            ">

                <strong>
                    Unable to generate report.
                </strong>

                <br>

                ${escapeHTML(
                    error.message
                )}

            </div>

        `;

    }

}


/* =========================================================
   DASHBOARD REPORT
========================================================= */

async function generateDashboardReport(){

    const year =
        document.getElementById(
            "filterYear"
        )?.value || "";


    const month =
        document.getElementById(
            "filterMonth"
        )?.value || "";


    const week =
        document.getElementById(
            "filterWeek"
        )?.value || "";


    try{

        const response =
            await fetch(
                `${API_URL}` +
                `?action=getDashboard` +
                `&year=${encodeURIComponent(year)}` +
                `&month=${encodeURIComponent(month)}` +
                `&week=${encodeURIComponent(week)}`
            );


        if(!response.ok){

            throw new Error(
                `HTTP Error ${response.status}`
            );

        }


        const result =
            await response.json();


        const data =
            Array.isArray(result.inventory)
                ? result.inventory
                : [];


        return createLocalInventorySummary(
            data
        );


    }catch(error){

        console.error(error);

        return null;

    }

}


/* =========================================================
   LOCAL INVENTORY SUMMARY
========================================================= */

function createLocalInventorySummary(data){

    const summary = {

        total: data.length,

        working:0,

        maintenance:0,

        pullout:0,

        types:{},

        departments:{},

        locations:{}

    };


    data.forEach(item => {

        const status =
            String(
                item.Status || ""
            )
            .trim()
            .toLowerCase();


        if(status === "working"){

            summary.working++;

        }else if(
            status === "maintenance"
        ){

            summary.maintenance++;

        }else if(
            status === "pull-out" ||
            status === "pullout"
        ){

            summary.pullout++;

        }


        const type =
            item.ItemType ||
            "Others";


        summary.types[type] =
            (summary.types[type] || 0) + 1;


        const department =
            item.Department ||
            "Unassigned";


        summary.departments[
            department
        ] =
            (
                summary.departments[
                    department
                ] || 0
            ) + 1;


        const location =
            item.Location ||
            "Unassigned";


        summary.locations[
            location
        ] =
            (
                summary.locations[
                    location
                ] || 0
            ) + 1;

    });


    return summary;

}


/* =========================================================
   COPY AI REPORT
========================================================= */

async function copyAIReport(){

    const resultElement =
        document.getElementById(
            "aiResult"
        );


    if(!resultElement){

        return;

    }


    const text =
        resultElement.innerText.trim();


    if(!text){

        alert(
            "There is no report to copy."
        );

        return;

    }


    try{

        await navigator.clipboard.writeText(
            text
        );


        alert(
            "Report copied to clipboard."
        );


    }catch(error){

        console.error(error);

        alert(
            "Unable to copy the report."
        );

    }

}


/* =========================================================
   DOWNLOAD AI REPORT AS TEXT
========================================================= */

function downloadAIReport(){

    const resultElement =
        document.getElementById(
            "aiResult"
        );


    if(!resultElement){

        return;

    }


    const text =
        resultElement.innerText.trim();


    if(!text){

        alert(
            "There is no report to download."
        );

        return;

    }


    const blob =
        new Blob(
            [text],
            {
                type:"text/plain;charset=utf-8"
            }
        );


    const url =
        URL.createObjectURL(
            blob
        );


    const link =
        document.createElement("a");


    link.href = url;


    link.download =
        `Computer-Inventory-Report-${formatFileDate()}.txt`;


    document.body.appendChild(link);


    link.click();


    document.body.removeChild(link);


    URL.revokeObjectURL(url);

}


/* =========================================================
   FILE DATE
========================================================= */

function formatFileDate(){

    const date =
        new Date();


    const year =
        date.getFullYear();


    const month =
        String(
            date.getMonth()+1
        ).padStart(2,"0");


    const day =
        String(
            date.getDate()
        ).padStart(2,"0");


    return `${year}-${month}-${day}`;

}


/* =========================================================
   PRINT AI REPORT
========================================================= */

function printAIReport(){

    const resultElement =
        document.getElementById(
            "aiResult"
        );


    if(!resultElement){

        return;

    }


    const report =
        resultElement.innerText.trim();


    if(!report){

        alert(
            "There is no AI report to print."
        );

        return;

    }


    const printWindow =
        window.open(
            "",
            "_blank",
            "width=900,height=800"
        );


    if(!printWindow){

        alert(
            "Please allow pop-ups to print the report."
        );

        return;

    }


    printWindow.document.write(`

        <!DOCTYPE html>

        <html>

        <head>

            <title>
                Computer Inventory AI Report
            </title>

            <style>

                body{
                    font-family:Arial,sans-serif;
                    margin:40px;
                    line-height:1.7;
                    color:#222;
                }

                h1{
                    text-align:center;
                }

                .date{
                    text-align:center;
                    color:#666;
                    margin-bottom:30px;
                }

                .report{
                    white-space:pre-wrap;
                }

            </style>

        </head>

        <body>

            <h1>
                COMPUTER INVENTORY REPORT
            </h1>

            <div class="date">

                Generated:
                ${escapeHTML(
                    new Date().toLocaleString()
                )}

            </div>

            <div class="report">

                ${escapeHTML(report)}

            </div>

        </body>

        </html>

    `);


    printWindow.document.close();


    printWindow.focus();


    setTimeout(
        function(){

            printWindow.print();

        },
        500
    );

}


/* =========================================================
   REFRESH REQUEST + SCHEDULE DATA
========================================================= */

async function refreshAllModules(){

    try{

        await Promise.all([

            loadInventory(),

            loadRequests(),

            loadSchedule(),

            loadDashboard()

        ]);


        alert(
            "All system data refreshed."
        );


    }catch(error){

        console.error(error);

        alert(
            "Some system data could not be refreshed."
        );

    }

}


/* =========================================================
   PAGE INITIALIZATION EXTENSION
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function(){

        /*
         * Dashboard and inventory are loaded
         * by Part 3A.
         *
         * Requests and schedules are loaded
         * when their sections are opened.
         */

        updateNotificationCount();

    }
);


/* =========================================================
   SAFE SECTION NAVIGATION
   This overrides the Part 3A version so that
   programmatic calls such as showSection("ai")
   work without relying on event.target.
========================================================= */

function showSection(sectionId){

    const sections =
        document.querySelectorAll(
            ".content-section"
        );


    sections.forEach(
        section =>
            section.classList.remove(
                "active"
            )
    );


    const target =
        document.getElementById(
            sectionId
        );


    if(!target){

        console.error(
            `Section "${sectionId}" not found.`
        );

        return;

    }


    target.classList.add(
        "active"
    );


    const menuItems =
        document.querySelectorAll(
            ".sidebar li"
        );


    menuItems.forEach(
        item =>
            item.classList.remove(
                "active"
            )
    );


    menuItems.forEach(item => {

        const onclick =
            item.getAttribute(
                "onclick"
            ) || "";


        if(
            onclick.includes(
                `'${sectionId}'`
            ) ||
            onclick.includes(
                `"${sectionId}"`
            )
        ){

            item.classList.add(
                "active"
            );

        }

    });


    if(sectionId === "inventory"){

        loadInventory();

    }


    if(sectionId === "request"){

        loadRequests();

    }


    if(sectionId === "schedule"){

        loadSchedule();

    }


    if(sectionId === "dashboard"){

        loadDashboard();

    }


    if(sectionId === "ai"){

        const prompt =
            document.getElementById(
                "aiPrompt"
            );


        if(prompt){

            prompt.focus();

        }

    }

}


/* =========================================================
   PERIOD FILTER HELPERS
========================================================= */

function getSelectedPeriod(){

    return {

        year:
            document.getElementById(
                "filterYear"
            )?.value || "",

        month:
            document.getElementById(
                "filterMonth"
            )?.value || "",

        week:
            document.getElementById(
                "filterWeek"
            )?.value || ""

    };

}


/* =========================================================
   EXPORT CURRENT INVENTORY TO CSV
========================================================= */

function exportInventoryCSV(){

    if(
        !Array.isArray(inventoryData) ||
        inventoryData.length === 0
    ){

        alert(
            "There is no inventory data to export."
        );

        return;

    }


    const headers = [

        "ComputerID",
        "ControlNumber",
        "CustodianName",
        "Department",
        "ItemType",
        "ItemDescriptions",
        "Brand",
        "Model",
        "SerialNumber",
        "PurchaseDate",
        "Location",
        "Status",
        "ProblemComplaint",
        "Recommendation",
        "DatePull-out",
        "DateReturn",
        "PlaceAT",
        "Remarks",
        "licensedwindow",
        "licensedSecurity",
        "Checkedby",
        "DateCleanUp",
        "Scheduled",
        "DateRequest",
        "DateCheckup"

    ];


    const csvRows = [];


    csvRows.push(
        headers.map(csvEscape).join(",")
    );


    inventoryData.forEach(item => {

        const row =
            headers.map(
                header =>
                    csvEscape(
                        item[header] ?? ""
                    )
            );


        csvRows.push(
            row.join(",")
        );

    });


    const csv =
        csvRows.join("\r\n");


    const blob =
        new Blob(
            [csv],
            {
                type:
                    "text/csv;charset=utf-8;"
            }
        );


    const url =
        URL.createObjectURL(
            blob
        );


    const link =
        document.createElement("a");


    link.href = url;


    link.download =
        `Computer-Inventory-${formatFileDate()}.csv`;


    document.body.appendChild(link);


    link.click();


    document.body.removeChild(link);


    URL.revokeObjectURL(url);

}


/* =========================================================
   CSV ESCAPE
========================================================= */

function csvEscape(value){

    const text =
        String(
            value ?? ""
        );


    return `"${text.replace(
        /"/g,
        '""'
    )}"`;

}


/* =========================================================
   REPORT GENERATOR MENU
========================================================= */

function openReportGenerator(){

    showSection("reports");

}


/* =========================================================
   SYSTEM STATUS
========================================================= */

function getSystemStatus(){

    return {

        apiConnected:
            API_URL &&
            !API_URL.includes(
                "PASTE_YOUR_WEB_APP_URL"
            ),

        inventoryRecords:
            inventoryData.length,

        requestRecords:
            requestData.length,

        scheduleRecords:
            scheduleData.length,

        lastUpdated:
            new Date().toISOString()

    };

}


/* =========================================================
   CONSOLE INFORMATION
========================================================= */

console.log(
    "Computer Inventory System - inventory.js Part 3C loaded."
);