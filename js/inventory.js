const GOOGLE_SCRIPT_URL =
    "https://script.google.com/macros/s/AKfycbwTREnh6XXho0-irBev6GF7hh4WH5vhY6hINXdm3aE3Lhe3W9eIHltvxMSAZEEq9F2Fzg/exec";


/* =========================================================
   ADMIN SESSION
========================================================= */

let adminVerified =
    false;


/* =========================================================
   QR CONTROL NUMBER
========================================================= */

let pendingQRControlNumber =
    "";


/* =========================================================
   CURRENT INVENTORY
========================================================= */

let currentControlNumber =
    "";


/* =========================================================
   DOM READY
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function () {


        /* -----------------------------------------------
           LOGIN FORM
        ----------------------------------------------- */

        const loginForm =
            document.getElementById(
                "loginForm"
            );


        if (loginForm) {

            loginForm.addEventListener(
                "submit",
                function (event) {

                    event.preventDefault();

                    login();

                }
            );

        }


        /* -----------------------------------------------
           SEARCH FORM
        ----------------------------------------------- */

        const searchForm =
            document.getElementById(
                "searchForm"
            );


        if (searchForm) {

            searchForm.addEventListener(
                "submit",
                function (event) {

                    event.preventDefault();

                    searchInventory();

                }
            );

        }


        /* -----------------------------------------------
           DOWNLOAD QR
        ----------------------------------------------- */

        const downloadButton =
            document.getElementById(
                "downloadQRButton"
            );


        if (downloadButton) {

            downloadButton.addEventListener(
                "click",
                downloadQR
            );

        }


        /* -----------------------------------------------
           PRINT QR
        ----------------------------------------------- */

        const printButton =
            document.getElementById(
                "printQRButton"
            );


        if (printButton) {

            printButton.addEventListener(
                "click",
                printQR
            );

        }


        /* -----------------------------------------------
           LOGOUT
        ----------------------------------------------- */

        const logoutButton =
            document.getElementById(
                "logoutButton"
            );


        if (logoutButton) {

            logoutButton.addEventListener(
                "click",
                logout
            );

        }


        /* -----------------------------------------------
           READ QR PARAMETER
        ----------------------------------------------- */

        readQRCodeParameter();

    }
);


/* =========================================================
   READ QR CONTROL NUMBER
========================================================= */

function readQRCodeParameter() {


    const params =
        new URLSearchParams(
            window.location.search
        );


    const controlNumber =
        params.get(
            "cn"
        );


    if (
        !controlNumber
    ) {

        return;

    }


    pendingQRControlNumber =
        controlNumber
            .trim();


    if (
        !pendingQRControlNumber
    ) {

        return;

    }


    const loginPage =
        document.getElementById(
            "loginPage"
        );


    const inventoryPage =
        document.getElementById(
            "inventoryPage"
        );


    if (loginPage) {

        loginPage.classList.remove(
            "hidden"
        );

    }


    if (inventoryPage) {

        inventoryPage.classList.add(
            "hidden"
        );

    }


    showStatus(

        document.getElementById(
            "loginStatus"
        ),

        "QR detected. Administrator login is required.",

        "info"

    );

}


/* =========================================================
   ADMIN LOGIN
========================================================= */

async function login() {


    const usernameElement =
        document.getElementById(
            "username"
        );


    const passwordElement =
        document.getElementById(
            "password"
        );


    const button =
        document.getElementById(
            "loginButton"
        );


    const status =
        document.getElementById(
            "loginStatus"
        );


    const username =
        usernameElement
            ? usernameElement.value.trim()
            : "";


    const password =
        passwordElement
            ? passwordElement.value
            : "";


    /* -----------------------------------------------
       VALIDATE
    ----------------------------------------------- */

    if (
        !username ||
        !password
    ) {

        showStatus(

            status,

            "Please enter username and password.",

            "error"

        );

        return;

    }


    /* -----------------------------------------------
       BUTTON
    ----------------------------------------------- */

    if (button) {

        button.disabled =
            true;

        button.innerText =
            "Verifying...";

    }


    showStatus(

        status,

        "Verifying administrator account...",

        "info"

    );


    try {


        /* -------------------------------------------
           API LOGIN
        ------------------------------------------- */

        const response =
            await apiRequest({

                action:
                    "login",

                username:
                    username,

                password:
                    password

            });


        console.log(
            "Login response:",
            response
        );


        /* -------------------------------------------
           LOGIN FAILED
        ------------------------------------------- */

        if (
            !response ||
            !response.success ||
            !response.verified
        ) {


            adminVerified =
                false;


            showStatus(

                status,

                response &&
                response.message

                    ? "❌ " +
                      response.message

                    : "❌ Incorrect username or password.",

                "error"

            );


            return;

        }


        /* -------------------------------------------
           LOGIN SUCCESS
        ------------------------------------------- */

        adminVerified =
            true;


        showStatus(

            status,

            "✓ Administrator verified successfully.",

            "success"

        );


        /* -------------------------------------------
           SHOW INVENTORY
        ------------------------------------------- */

        setTimeout(

            function () {


                const loginPage =
                    document.getElementById(
                        "loginPage"
                    );


                const inventoryPage =
                    document.getElementById(
                        "inventoryPage"
                    );


                if (loginPage) {

                    loginPage.classList.add(
                        "hidden"
                    );

                }


                if (inventoryPage) {

                    inventoryPage.classList.remove(
                        "hidden"
                    );

                }


                /* -----------------------------------
                   QR SCAN
                ----------------------------------- */

                if (
                    pendingQRControlNumber
                ) {


                    const input =
                        document.getElementById(
                            "controlNumber"
                        );


                    const qrControl =
                        pendingQRControlNumber;


                    if (input) {

                        input.value =
                            qrControl;

                    }


                    pendingQRControlNumber =
                        "";


                    searchInventory(
                        qrControl
                    );


                } else {


                    const input =
                        document.getElementById(
                            "controlNumber"
                        );


                    if (input) {

                        input.focus();

                    }

                }


                /* -----------------------------------
                   CLEAR CREDENTIALS
                ----------------------------------- */

                if (usernameElement) {

                    usernameElement.value =
                        "";

                }


                if (passwordElement) {

                    passwordElement.value =
                        "";

                }


            },

            300

        );


    } catch (error) {


        console.error(
            "Login error:",
            error
        );


        adminVerified =
            false;


        showStatus(

            status,

            "❌ " +
            error.message,

            "error"

        );


    } finally {


        if (button) {

            button.disabled =
                false;

            button.innerText =
                "Sign In";

        }

    }

}

/* =========================================================
   SEARCH INVENTORY
========================================================= */

async function searchInventory(
    controlFromQR = null
) {


    /* -----------------------------------------------
       SECURITY
    ----------------------------------------------- */

    if (
        !adminVerified
    ) {


        showStatus(

            document.getElementById(
                "searchStatus"
            ),

            "Administrator login required.",

            "error"

        );


        return;

    }


    const input =
        document.getElementById(
            "controlNumber"
        );


    const status =
        document.getElementById(
            "searchStatus"
        );


    const button =
        document.getElementById(
            "searchButton"
        );


    const result =
        document.getElementById(
            "inventoryResult"
        );


    const empty =
        document.getElementById(
            "emptyState"
        );


    /* -----------------------------------------------
       GET CONTROL NUMBER
    ----------------------------------------------- */

    const controlNumber =
        controlFromQR !== null

            ? String(
                controlFromQR
              ).trim()

            : input
                ? input.value.trim()
                : "";


    /* -----------------------------------------------
       EMPTY SEARCH
    ----------------------------------------------- */

    if (
        !controlNumber
    ) {


        showStatus(

            status,

            "❌ Please enter a Control Number.",

            "error"

        );


        if (result) {

            result.classList.add(
                "hidden"
            );

        }


        if (empty) {

            empty.classList.remove(
                "hidden"
            );

        }


        return;

    }


    /* -----------------------------------------------
       SEARCHING
    ----------------------------------------------- */

    if (button) {

        button.disabled =
            true;

        button.innerText =
            "Searching...";

    }


    showStatus(

        status,

        "Searching Google Sheets...",

        "info"

    );


    try {


        /* -------------------------------------------
           API SEARCH
        ------------------------------------------- */

        const response =
            await apiRequest({

                action:
                    "search",

                controlNumber:
                    controlNumber

            });


        console.log(
            "Search response:",
            response
        );


        /* -------------------------------------------
           NOT FOUND
        ------------------------------------------- */

        if (
            !response ||
            !response.success ||
            !response.found
        ) {


            if (result) {

                result.classList.add(
                    "hidden"
                );

            }


            if (empty) {

                empty.classList.remove(
                    "hidden"
                );

            }


            showStatus(

                status,

                response &&
                response.message

                    ? "❌ " +
                      response.message

                    : "❌ No Control Number found: " +
                      controlNumber,

                "error"

            );


            return;

        }


        /* -------------------------------------------
           RECORD FOUND
        ------------------------------------------- */

        const data =
            response.data;


        if (
            !data
        ) {

            throw new Error(
                "Inventory record is empty."
            );

        }


        /* -------------------------------------------
           SAVE CONTROL NUMBER
        ------------------------------------------- */

        currentControlNumber =
            data.ControlNumber ||
            controlNumber;


        currentControlNumber =
            String(
                currentControlNumber
            ).trim();


        console.log(
            "Current Control Number:",
            currentControlNumber
        );


        /* -------------------------------------------
           DISPLAY DETAILS
        ------------------------------------------- */

        displayInventory(
            data
        );


        /* -------------------------------------------
           GENERATE QR
        ------------------------------------------- */

        generateQRCode(
            currentControlNumber
        );


        /* -------------------------------------------
           SHOW RESULT
        ------------------------------------------- */

        if (result) {

            result.classList.remove(
                "hidden"
            );

        }


        if (empty) {

            empty.classList.add(
                "hidden"
            );

        }


        showStatus(

            status,

            "✓ Control Number found successfully.",

            "success"

        );


    } catch (error) {


        console.error(
            "Inventory search error:",
            error
        );


        showStatus(

            status,

            "❌ " +
            error.message,

            "error"

        );


    } finally {


        if (button) {

            button.disabled =
                false;

            button.innerText =
                "Search";

        }

    }

}


/* =========================================================
   DISPLAY INVENTORY
========================================================= */

function displayInventory(
    data
) {


    setText(
        "displayControlNumber",
        data.ControlNumber
    );


    setText(
        "dCustodian",
        data.CustodianName
    );


    setText(
        "dDepartment",
        data.Department
    );


    setText(
        "dItemType",
        data.ItemType
    );


    setText(
        "dDescription",
        data.ItemDescriptions
    );


    setText(
        "dBrand",
        data.Brand
    );


    setText(
        "dModel",
        data.Model
    );


    setText(
        "dSerialNumber",
        data.SerialNumber
    );


    setText(
        "dPurchaseDate",
        data.PurchaseDate
    );


    setText(
        "dLocation",
        data.Location
    );


    setText(
        "dStatusDetail",
        data.Status
    );


    setText(
        "dProblemComplaint",
        data.ProblemComplaint
    );


    setText(
        "dDatePullout",
        data["DatePull-out"]
    );


    setText(
        "dDateReturn",
        data.DateReturn
    );


    setText(
        "dPlaceAT",
        data.PlaceAT
    );


    setText(
        "dRemarks",
        data.Remarks
    );


    setText(
        "dWindows",
        data.licensedwindow
    );


    setText(
        "dSecurity",
        data.licensedSecurity
    );


    setText(
        "qrControlNumber",
        data.ControlNumber
    );


    setText(
        "displayStatus",
        data.Status
    );

}


/* =========================================================
   GENERATE QR URL
========================================================= */

function generateQRCodeURL(
    controlNumber
) {


    const baseURL =
        window.location.origin +
        window.location.pathname;


    const cleanControlNumber =
        String(
            controlNumber || ""
        ).trim();


    return (

        baseURL +

        "?cn=" +

        encodeURIComponent(
            cleanControlNumber
        )

    );

}


/* =========================================================
   GENERATE QR CODE
========================================================= */

function generateQRCode(
    controlNumber
) {


    console.log(
        "========== QR GENERATION =========="
    );


    console.log(
        "Control Number:",
        controlNumber
    );


    const canvas =
        document.getElementById(
            "qrCanvas"
        );


    const status =
        document.getElementById(
            "qrStatus"
        );


    /* -----------------------------------------------
       CHECK CONTROL NUMBER
    ----------------------------------------------- */

    if (
        !controlNumber
    ) {

        console.error(
            "QR ERROR: Control Number is empty."
        );

        showStatus(

            status,

            "❌ Control Number is empty.",

            "error"

        );

        return;

    }


    /* -----------------------------------------------
       CHECK CANVAS
    ----------------------------------------------- */

    if (
        !canvas
    ) {

        console.error(
            "QR ERROR: #qrCanvas was not found."
        );

        showStatus(

            status,

            "❌ QR canvas was not found.",

            "error"

        );

        return;

    }


    console.log(
        "QR Canvas found:",
        canvas
    );


    /* -----------------------------------------------
       CHECK QR LIBRARY
    ----------------------------------------------- */

    if (
        typeof QRCode ===
        "undefined"
    ) {

        console.error(
            "QR ERROR: QRCode library is not loaded."
        );

        showStatus(

            status,

            "❌ QR Code library is not loaded.",

            "error"

        );

        return;

    }


    /* -----------------------------------------------
       CHECK TOCANVAS
    ----------------------------------------------- */

    if (
        typeof QRCode.toCanvas !==
        "function"
    ) {

        console.error(
            "QR ERROR: QRCode.toCanvas() is unavailable."
        );

        showStatus(

            status,

            "❌ QRCode.toCanvas() is unavailable.",

            "error"

        );

        return;

    }


    /* -----------------------------------------------
       CREATE QR URL
    ----------------------------------------------- */

    const qrURL =
        generateQRCodeURL(
            controlNumber
        );


    console.log(
        "QR URL:",
        qrURL
    );


    /* -----------------------------------------------
       CLEAR PREVIOUS QR
    ----------------------------------------------- */

    const context =
        canvas.getContext(
            "2d"
        );


    if (context) {

        context.clearRect(
            0,
            0,
            canvas.width,
            canvas.height
        );

    }


    /* -----------------------------------------------
       GENERATE QR
    ----------------------------------------------- */

    QRCode.toCanvas(

        canvas,

        qrURL,

        {

            width:
                300,

            margin:
                3,

            errorCorrectionLevel:
                "H"

        },

        function(error) {


            if (error) {

                console.error(
                    "QR GENERATION ERROR:",
                    error
                );

                showStatus(

                    status,

                    "❌ QR code generation failed.",

                    "error"

                );

                return;

            }


            console.log(
                "✓ QR CODE GENERATED SUCCESSFULLY"
            );


            console.log(
                "QR Canvas:",
                canvas.width,
                "x",
                canvas.height
            );


            showStatus(

                status,

                "✓ QR code generated successfully.",

                "success"

            );

        }

    );

}


/* =========================================================
   DOWNLOAD QR CODE
========================================================= */

function downloadQR() {


    if (
        !currentControlNumber
    ) {

        showStatus(

            document.getElementById(
                "qrStatus"
            ),

            "Search a Control Number first.",

            "error"

        );

        return;

    }


    const canvas =
        document.getElementById(
            "qrCanvas"
        );


    if (
        !canvas ||
        canvas.width === 0 ||
        canvas.height === 0
    ) {

        showStatus(

            document.getElementById(
                "qrStatus"
            ),

            "❌ QR code is not ready.",

            "error"

        );

        return;

    }


    try {


        const image =
            canvas.toDataURL(
                "image/png"
            );


        const link =
            document.createElement(
                "a"
            );


        link.href =
            image;


        link.download =
            String(
                currentControlNumber
            ) +
            "_QR.png";


        document.body.appendChild(
            link
        );


        link.click();


        link.remove();


        showStatus(

            document.getElementById(
                "qrStatus"
            ),

            "✓ QR code downloaded successfully.",

            "success"

        );


    } catch (error) {


        console.error(
            "QR download error:",
            error
        );


        showStatus(

            document.getElementById(
                "qrStatus"
            ),

            "❌ QR download failed.",

            "error"

        );

    }

}


/* =========================================================
   PRINT QR CODE
========================================================= */

function printQR() {


    if (
        !currentControlNumber
    ) {

        alert(
            "Please search for a Control Number first."
        );

        return;

    }


    const canvas =
        document.getElementById(
            "qrCanvas"
        );


    if (
        !canvas ||
        canvas.width === 0 ||
        canvas.height === 0
    ) {

        alert(
            "QR code is not available."
        );

        return;

    }


    try {


        const image =
            canvas.toDataURL(
                "image/png"
            );


        const control =
            escapeHTML(
                currentControlNumber
            );


        const printWindow =
            window.open(

                "",

                "_blank",

                "width=500,height=650"

            );


        if (
            !printWindow
        ) {

            alert(
                "Please allow pop-ups for printing."
            );

            return;

        }


        printWindow.document.write(`

<!DOCTYPE html>

<html>

<head>

<meta charset="UTF-8">

<title>
Computer Inventory QR
</title>

<style>

@page {

    margin: 10mm;

}

body {

    margin: 0;

    padding: 20px;

    text-align: center;

    font-family: Arial, sans-serif;

}

.sticker {

    width: 350px;

    margin: auto;

    padding: 20px;

    border: 1px solid #000;

}

h2 {

    margin:
        0 0 15px;

    font-size:
        20px;

}

img {

    width:
        300px;

    height:
        300px;

}

.control {

    margin-top:
        12px;

    font-size:
        20px;

    font-weight:
        bold;

}

</style>

</head>

<body>

<div class="sticker">

<h2>
COMPUTER INVENTORY
</h2>

<img
    src="${image}"
    alt="QR Code"
>

<div class="control">
${control}
</div>

</div>

<script>

window.onload = function() {

    setTimeout(
        function() {

            window.print();

        },
        500
    );

};

<\/script>

</body>

</html>

`);


        printWindow.document.close();


    } catch (error) {


        console.error(
            "Print QR error:",
            error
        );


        alert(
            "Unable to prepare QR code for printing."
        );

    }

}

/* =========================================================
   LOGOUT
========================================================= */

function logout() {


    /*
     * Current Code.gs does not have
     * a logout API action.
     *
     * Therefore logout is handled
     * locally in the browser.
     */

    adminVerified =
        false;


    currentControlNumber =
        "";


    pendingQRControlNumber =
        "";


    /* -----------------------------------------------
       CLEAR URL
    ----------------------------------------------- */

    try {

        window.history.replaceState(

            {},

            document.title,

            window.location.pathname

        );

    } catch (error) {

        console.error(
            "URL clear error:",
            error
        );

    }


    /* -----------------------------------------------
       SHOW LOGIN
    ----------------------------------------------- */

    showLoginPage();

}


/* =========================================================
   SHOW LOGIN PAGE
========================================================= */

function showLoginPage() {


    const loginPage =
        document.getElementById(
            "loginPage"
        );


    const inventoryPage =
        document.getElementById(
            "inventoryPage"
        );


    if (loginPage) {

        loginPage.classList.remove(
            "hidden"
        );

    }


    if (inventoryPage) {

        inventoryPage.classList.add(
            "hidden"
        );

    }


    /* -----------------------------------------------
       CLEAR SEARCH
    ----------------------------------------------- */

    const input =
        document.getElementById(
            "controlNumber"
        );


    if (input) {

        input.value =
            "";

    }


    /* -----------------------------------------------
       CLEAR RESULT
    ----------------------------------------------- */

    const result =
        document.getElementById(
            "inventoryResult"
        );


    if (result) {

        result.classList.add(
            "hidden"
        );

    }


    /* -----------------------------------------------
       SHOW EMPTY STATE
    ----------------------------------------------- */

    const empty =
        document.getElementById(
            "emptyState"
        );


    if (empty) {

        empty.classList.remove(
            "hidden"
        );

    }


    /* -----------------------------------------------
       CLEAR CURRENT QR
    ----------------------------------------------- */

    const canvas =
        document.getElementById(
            "qrCanvas"
        );


    if (canvas) {

        const context =
            canvas.getContext(
                "2d"
            );


        if (context) {

            context.clearRect(
                0,
                0,
                canvas.width,
                canvas.height
            );

        }

    }

}


/* =========================================================
   API REQUEST
========================================================= */

async function apiRequest(
    payload
) {


    /* -----------------------------------------------
       CHECK URL
    ----------------------------------------------- */

    if (
        !GOOGLE_SCRIPT_URL ||
        GOOGLE_SCRIPT_URL.includes(
            "YOUR_GOOGLE_APPS_SCRIPT"
        )
    ) {

        throw new Error(
            "Google Apps Script URL has not been configured."
        );

    }


    /* -----------------------------------------------
       SEND POST
       
       text/plain is intentional.
       It avoids an OPTIONS preflight request.
    ----------------------------------------------- */

    const response =
        await fetch(

            GOOGLE_SCRIPT_URL,

            {

                method:
                    "POST",

                headers: {

                    "Content-Type":
                        "text/plain;charset=utf-8"

                },

                body:
                    JSON.stringify(
                        payload
                    )

            }

        );


    /* -----------------------------------------------
       READ RESPONSE
    ----------------------------------------------- */

    const responseText =
        await response.text();


    console.log(
        "Google Apps Script response:",
        responseText
    );


    /* -----------------------------------------------
       HTTP ERROR
    ----------------------------------------------- */

    if (
        !response.ok
    ) {

        throw new Error(

            "HTTP " +
            response.status +
            ": " +
            responseText

        );

    }


    /* -----------------------------------------------
       EMPTY RESPONSE
    ----------------------------------------------- */

    if (
        !responseText
    ) {

        throw new Error(
            "Google Apps Script returned an empty response."
        );

    }


    /* -----------------------------------------------
       PARSE JSON
    ----------------------------------------------- */

    try {

        return JSON.parse(
            responseText
        );

    } catch (error) {

        console.error(
            "Invalid JSON from Apps Script:",
            responseText
        );


        throw new Error(

            "Google Apps Script did not return valid JSON."

        );

    }

}


/* =========================================================
   SET TEXT
========================================================= */

function setText(
    id,
    value
) {


    const element =
        document.getElementById(
            id
        );


    if (!element) {

        console.warn(
            "Element not found:",
            id
        );

        return;

    }


    if (
        value === null ||
        value === undefined ||
        String(value).trim() === ""
    ) {

        element.innerText =
            "-";

    } else {

        element.innerText =
            String(value);

    }

}


/* =========================================================
   STATUS MESSAGE
========================================================= */

function showStatus(
    element,
    message,
    type
) {


    if (!element) {

        return;

    }


    element.innerText =
        message;


    element.className =
        "status-message";


    if (
        type === "success"
    ) {

        element.classList.add(
            "status-success"
        );


    } else if (
        type === "error"
    ) {

        element.classList.add(
            "status-error"
        );


    } else {

        element.classList.add(
            "status-info"
        );

    }

}


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHTML(
    value
) {


    return String(
        value
    )

    .replace(
        /&/g,
        "&amp;"
    )

    .replace(
        /</g,
        "&lt;"
    )

    .replace(
        />/g,
        "&gt;"
    )

    .replace(
        /"/g,
        "&quot;"
    )

    .replace(
        /'/g,
        "&#039;"
    );

}