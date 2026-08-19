const API = "https://script.google.com/macros/s/AKfycbyWwo2ypZR2W42f_siY_n6fldixPuxH-VS9sp_FVNFfKxDS5R2B_bdfexcnEIOaq1Dsvw/exec";

let currentControl = "";

window.onload = () => {
  const params = new URLSearchParams(window.location.search);
  const cn = params.get("cn");

  if (cn) {
    document.getElementById("loginPage").style.display = "none";
    document.getElementById("searchPage").style.display = "block";
    document.getElementById("controlNumber").value = cn;
    searchInventory();
  }
};

async function login() {
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  const res = await fetch(API, {
    method: "POST",
    body: JSON.stringify({
      action: "login",
      username,
      password
    })
  });

  const data = await res.json();

  if (data.success) {
    loginPage.style.display = "none";
    searchPage.style.display = "block";
  } else {
    loginMsg.innerText = data.message;
  }
}

async function searchInventory() {
  const controlNumber = document.getElementById("controlNumber").value.trim();

  const res = await fetch(API, {
    method: "POST",
    body: JSON.stringify({
      action: "search",
      controlNumber
    })
  });

  const data = await res.json();

  if (!data.success) {
    result.style.display = "none";
    searchMsg.innerText = "No Control Number Found";
    return;
  }

  searchMsg.innerText = "";
  result.style.display = "block";

  const d = data.data;
  currentControl = d.ControlNumber;

  dControl.innerText = d.ControlNumber;
  dCustodian.innerText = d.CustodianName;
  dDepartment.innerText = d.Department;
  dItem.innerText = d.ItemType;
  dBrand.innerText = d.Brand;
  dModel.innerText = d.Model;
  dSerial.innerText = d.SerialNumber;
  dLocation.innerText = d.Location;
  dStatus.innerText = d.Status;
  dRemarks.innerText = d.Remarks;

  QRCode.toCanvas(
    document.getElementById("qrcode"),
    API + "?cn=" + encodeURIComponent(currentControl),
    { width: 220 }
  );
}

function downloadQR() {
  const link = document.createElement("a");
  link.download = currentControl + "_QR.png";
  link.href = document.getElementById("qrcode").toDataURL();
  link.click();
}