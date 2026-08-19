/* =========================================================
   COMPUTER INVENTORY
   inventory.js
========================================================= */


/*
 * =========================================================
 * GOOGLE APPS SCRIPT WEB APP URL
 * =========================================================
 *
 * Example:
 *
 * https://script.google.com/macros/s/XXXXXXXX/exec
 *
 */

const GOOGLE_SCRIPT_URL =
    "YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL";


/*
 * Current administrator session
 */

let adminVerified = false;


/*
 * Control Number received from QR
 */

let pendingQRControlNumber = "";


/*
 * Current inventory record
 */

let currentControlNumber = "";


/* =========================================================
   DOM READY
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function () {


        /*
         * Elements
         */

        const loginForm =
            document.getElementById(
                "loginForm"
            );


        const searchForm =
            document.getElementById(
                "searchForm"
            );


        /*
         * Login
         */

        loginForm.addEventListener(
            "submit",
            function (event) {

                event.preventDefault();

                login();

            }
        );


        /*
         * Search
         */

        searchForm.addEventListener(
            "submit",
            function (event) {

                event.preventDefault();

                searchInventory();

            }
        );


        /*
         * QR buttons
         */

        document
            .getElementById(
                "downloadQRButton"
            )
            .addEventListener(
                "click",
                downloadQR
            );


        document
            .getElementById(
                "printQRButton"
            )
            .addEventListener(
                "click",
                printQR
            );


        /*
         * Logout
         */

        document
            .getElementById(
                "logoutButton"
            )
            .addEventListener(
                "click",
                logout
            );


        /*
         * Check QR parameter
         */

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
        params.get("cn");


    if (!controlNumber) {

        return;

    }


    pendingQRControlNumber =
        controlNumber.trim();


    /*
     * Show login page.
     *
     * IMPORTANT:
     * QR does NOT bypass login.
     */

    document
        .getElementById(
            "loginPage"
        )
        .classList.remove("hidden");


    document
        .getElementById(
            "inventoryPage"
        )
        .classList.add("hidden");


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


    const username =
        document
            .getElementById(
                "username"
            )
            .value
            .trim();


    const password =
        document
            .getElementById(
                "password"
            )
            .value;


    const button =
        document
            .getElementById(
                "loginButton"
            );


    const status =
        document
            .getElementById(
                "loginStatus"
            );


    if (!username || !password) {

        showStatus(
            status,
            "Please enter username and password.",
            "error"
        );

        return;

    }


    button.disabled = true;

    button.innerText =
        "Verifying...";


    showStatus(
        status,
        "Verifying administrator account...",
        "info"
    );


    try {


        const response =
            await apiRequest({

                action: "login",

                username:
                    username,

                password:
                    password

            });


        if (
            !response ||
            !response.success ||
            !response.verified
        ) {


            adminVerified = false;


            showStatus(
                status,
                "❌ Incorrect username or password.",
                "error"
            );


            return;

        }


        /*
         * Administrator successfully verified.
         */

        adminVerified = true;


        showStatus(
            status,
            "✓ Administrator verified successfully.",
            "success"
        );


        setTimeout(
            function () {


                document
                    .getElementById(
                        "loginPage"
                    )
                    .classList.add(
                        "hidden"
                    );


                document
                    .getElementById(
                        "inventoryPage"
                    )
                    .classList.remove(
                        "hidden"
                    );


                /*
                 * QR scan?
                 *
                 * Automatically search.
                 */

                if (
                    pendingQRControlNumber
                ) {


                    document
                        .getElementById(
                            "controlNumber"
                        )
                        .value =
                        pendingQRControlNumber;


                    const qrControl =
                        pendingQRControlNumber;


                    pendingQRControlNumber =
                        "";


                    searchInventory(
                        qrControl
                    );


                } else {


                    document
                        .getElementById(
                            "controlNumber"
                        )
                        .focus();

                }


                /*
                 * Clear login fields.
                 */

                document
                    .getElementById(
                        "username"
                    )
                    .value = "";


                document
                    .getElementById(
                        "password"
                    )
                    .value = "";


            },
            600
        );


    } catch (error) {


        console.error(error);


        showStatus(
            status,
            "❌ Unable to connect to Google Apps Script.",
            "error"
        );


    } finally {


        button.disabled = false;

        button.innerText =
            "Sign In";


    }

}


/* =========================================================
   SEARCH INVENTORY
========================================================= */

async function searchInventory(
    controlFromQR = null
) {


    /*
     * Security check
     */

    if (!adminVerified) {

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


    const controlNumber =
        controlFromQR ||
        input.value.trim();


    if (!controlNumber) {


        showStatus(
            status,
            "❌ Please enter a Control Number.",
            "error"
        );


        result.classList.add(
            "hidden"
        );


        empty.classList.remove(
            "hidden"
        );


        return;

    }


    button.disabled = true;

    button.innerText =
        "Searching...";


    showStatus(
        status,
        "Searching Google Sheets...",
        "info"
    );


    try {


        const response =
            await apiRequest({

                action: "search",

                controlNumber:
                    controlNumber

            });


        if (
            !response ||
            !response.success ||
            !response.found
        ) {


            result.classList.add(
                "hidden"
            );


            empty.classList.remove(
                "hidden"
            );


            showStatus(
                status,
                "❌ No Control Number found: " +
                controlNumber,
                "error"
            );


            return;

        }


        /*
         * Record found.
         */

        const data =
            response.data;


        currentControlNumber =
            data.ControlNumber ||
            controlNumber;


        displayInventory(
            data
        );


        generateQRCode(
            currentControlNumber
        );


        result.classList.remove(
            "hidden"
        );


        empty.classList.add(
            "hidden"
        );


        showStatus(
            status,
            "✓ Control Number found successfully.",
            "success"
        );


    } catch (error) {


        console.error(error);


        showStatus(
            status,
            "❌ Unable to retrieve inventory data.",
            "error"
        );


    } finally {


        button.disabled = false;

        button.innerText =
            "Search";

    }

}


/* =========================================================
   DISPLAY INVENTORY
========================================================= */

function displayInventory(data) {


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
   GENERATE QR
========================================================= */

function generateQRCodeURL(
    controlNumber
) {


    /*
     * QR points back to GitHub Pages.
     *
     * Example:
     *
     * https://username.github.io/repository/
     * ?cn=PC-000001
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


    const qrURL =
        generateQRCodeURL(
            controlNumber
        );


    QRCode.toCanvas(

        canvas,

        qrURL,

        {

            width: 300,

            margin: 3,

            errorCorrectionLevel:
                "H"

        },

        function(error) {


            if (error) {


                console.error(error);


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
   DOWNLOAD QR
========================================================= */

function downloadQR() {


    if (!currentControlNumber) {


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


    /*
     * Verify canvas.
     */

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
            currentControlNumber +
            "_QR.png";


        document
            .body
            .appendChild(
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


        console.error(error);


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
   PRINT QR
========================================================= */

function printQR() {


    if (!currentControlNumber) {


        alert(
            "Please search for a Control Number first."
        );


        return;

    }


    const canvas =
        document.getElementById(
            "qrCanvas"
        );


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


    if (!printWindow) {


        alert(
            "Please allow pop-ups for printing."
        );


        return;

    }


    printWindow.document.write(`

        <!DOCTYPE html>

        <html>

        <head>

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

                    font-size: 20px;

                }


                img {

                    width: 300px;

                    height: 300px;

                }


                .control {

                    margin-top: 12px;

                    font-size: 20px;

                    font-weight: bold;

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
   API REQUEST
========================================================= */

async function apiRequest(
    payload
) {


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


    const response =
        await fetch(
            GOOGLE_SCRIPT_URL,
            {

                method: "POST",

                body:
                    JSON.stringify(
                        payload
                    )

            }
        );


    if (!response.ok) {


        throw new Error(
            "HTTP error " +
            response.status
        );

    }


    return await response.json();

}


/* =========================================================
   TEXT
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
   STATUS
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

    }


    else if (
        type === "error"
    ) {

        element.classList.add(
            "status-error"
        );

    }


    else {

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


    return String(value)

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


/* =========================================================
   LOGOUT
========================================================= */

function logout() {


    adminVerified =
        false;


    pendingQRControlNumber =
        "";


    currentControlNumber =
        "";


    document
        .getElementById(
            "inventoryPage"
        )
        .classList.add(
            "hidden"
        );


    document
        .getElementById(
            "loginPage"
        )
        .classList.remove(
            "hidden"
        );


    document
        .getElementById(
            "inventoryResult"
        )
        .classList.add(
            "hidden"
        );


    document
        .getElementById(
            "emptyState"
        )
        .classList.remove(
            "hidden"
        );


    document
        .getElementById(
            "username"
        )
        .value = "";


    document
        .getElementById(
            "password"
        )
        .value = "";


    document
        .getElementById(
            "controlNumber"
        )
        .value = "";


    document
        .getElementById(
            "loginStatus"
        )
        .innerText = "";


    document
        .getElementById(
            "searchStatus"
        )
        .innerText = "";


    /*
     * Remove QR parameter from browser URL
     * after logout.
     */

    window.history.replaceState(
        {},
        document.title,
        window.location.pathname
    );

}