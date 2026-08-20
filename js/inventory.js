const GOOGLE_SCRIPT_URL =
    "https://script.google.com/macros/s/AKfycby9cez0JDVPE4GzJRouiD6TaPmSDqDIiWeQWDSaA6MbpD9ED3BrYyNIpeLm_aenH6RTFg/exe";


/* =========================================================
   ADMIN SESSION
========================================================= */

let adminVerified =
    false;


let sessionToken =
    "";


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
           CHECK QR PARAMETER
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


    /*
     * QR never bypasses
     * administrator login.
     */

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
       Validate
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
       Button
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
           Login failed
        ------------------------------------------- */

        if (
            !response ||
            !response.success ||
            !response.verified ||
            !response.sessionToken
        ) {


            adminVerified =
                false;


            sessionToken =
                "";


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
           Login successful
        ------------------------------------------- */

        adminVerified =
            true;


        sessionToken =
            response.sessionToken;


        showStatus(

            status,

            "✓ Administrator verified successfully.",

            "success"

        );


        /* -------------------------------------------
           Show inventory
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


                    if (input) {

                        input.value =
                            pendingQRControlNumber;

                    }


                    const qrControl =
                        pendingQRControlNumber;


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
                   Clear credentials
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

            500

        );


    } catch (error) {


        console.error(
            "Login error:",
            error
        );


        adminVerified =
            false;


        sessionToken =
            "";


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
       Security
    ----------------------------------------------- */

    if (
        !adminVerified ||
        !sessionToken
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
       Control Number
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
       Empty search
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
       Searching
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
                    controlNumber,

                sessionToken:
                    sessionToken

            });


        console.log(
            "Search response:",
            response
        );


        /* -------------------------------------------
           Session expired
        ------------------------------------------- */

        if (
            response &&
            response.authenticated === false
        ) {


            adminVerified =
                false;


            sessionToken =
                "";


            showLoginPage();


            showStatus(

                document.getElementById(
                    "loginStatus"
                ),

                "Your administrator session has expired. Please sign in again.",

                "error"

            );


            return;

        }


        /* -------------------------------------------
           Not found
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
           Record found
        ------------------------------------------- */

        const data =
            response.data;


        currentControlNumber =
            data.ControlNumber ||
            controlNumber;


        /* -------------------------------------------
           Display details
        ------------------------------------------- */

        displayInventory(
            data
        );


        /* -------------------------------------------
           Generate QR
        ------------------------------------------- */

        generateQRCode(
            currentControlNumber
        );


        /* -------------------------------------------
           Show result
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


    /*
     * QR opens the current GitHub website
     * with ?cn=10017
     *
     * Example:
     *
     * https://russelvillaflores.digital/
     * ?cn=10017
     */

    const baseURL =
        window.location.origin +
        window.location.pathname;


    return (

        baseURL +

        "?cn=" +

        encodeURIComponent(
            controlNumber
        )

    );

}


/* =========================================================
   GENERATE QR CODE
========================================================= */

function generateQRCode(
    controlNumber
) {


    const canvas =
        document.getElementById(
            "qrCanvas"
        );


    const status =
        document.getElementById(
            "qrStatus"
        );


    if (!canvas) {

        return;

    }


    if (
        typeof QRCode ===
        "undefined"
    ) {


        showStatus(

            status,

            "❌ QR Code library is not loaded.",

            "error"

        );


        return;

    }


    const qrURL =
        generateQRCodeURL(
            controlNumber
        );


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
                    error
                );


                showStatus(

                    status,

                    "❌ QR code generation failed.",

                    "error"

                );


                return;

            }


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


        /*
         * Convert QR canvas
         * to PNG
         */

        const image =
            canvas.toDataURL(
                "image/png"
            );


        /*
         * Create download
         */

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
        !canvas
    ) {


        alert(
            "QR code is not available."
        );


        return;

    }


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

}


/* =========================================================
   LOGOUT
========================================================= */

async function logout() {


    try {


        /*
         * Tell Apps Script
         * to destroy session.
         */

        if (
            sessionToken
        ) {


            await apiRequest({

                action:
                    "logout",

                sessionToken:
                    sessionToken

            });

        }


    } catch (error) {


        console.error(
            "Logout error:",
            error
        );

    }


    /*
     * Clear local session
     */

    adminVerified =
        false;


    sessionToken =
        "";


    currentControlNumber =
        "";


    pendingQRControlNumber =
        "";


    /*
     * Clear URL
     */

    try {

        window.history.replaceState(
            {},
            document.title,
            window.location.pathname
        );

    } catch (error) {

        console.error(error);

    }


    /*
     * Show login
     */

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


    /*
     * Clear search
     */

    const input =
        document.getElementById(
            "controlNumber"
        );


    if (input) {

        input.value =
            "";

    }


    /*
     * Clear result
     */

    const result =
        document.getElementById(
            "inventoryResult"
        );


    if (result) {

        result.classList.add(
            "hidden"
        );

    }


}


/* =========================================================
   API REQUEST
========================================================= */

async function apiRequest(
    payload
) {


    /*
     * Check URL
     */

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


    /*
     * Send POST request
     *
     * text/plain is intentional.
     *
     * It avoids the browser sending
     * an OPTIONS preflight request
     * to Google Apps Script.
     */

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


    /*
     * Read raw response first.
     */

    const responseText =
        await response.text();


    console.log(
        "Google Apps Script response:",
        responseText
    );


    /*
     * HTTP error
     */

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


    /*
     * Parse JSON
     */

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
