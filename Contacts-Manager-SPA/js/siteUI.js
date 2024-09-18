//<span class="cmdIcon fa-solid fa-ellipsis-vertical"></span>
let contentScrollPosition = 0;
Init_UI();
fetchCategories();

function Init_UI() {
    renderbookmarks();
    $('#createbookmark').on("click", async function () {
        saveContentScrollPosition();
        renderCreatebookmarkForm();
    });
    $('#abort').on("click", async function () {
        renderbookmarks();
    });
    $('#aboutCmd').on("click", function () {
        renderAbout();
    });
}

function renderAbout() {
    saveContentScrollPosition();
    eraseContent();
    $("#createbookmark").hide();
    $("#abort").show();
    $("#actionTitle").text("À propos...");
    $("#content").append(
        $(`
            <div class="aboutContainer">
                <h2>Gestionnaire de bookmarks</h2>
                <hr>
                <p>
                    Petite application de gestion de bookmarks à titre de démonstration
                    d'interface utilisateur monopage réactive.
                </p>
                <p>
                    Auteur: Nicolas Chourot
                </p>
                <p>
                    Collège Lionel-Groulx, automne 2024
                </p>
            </div>
        `))
}
async function renderbookmarks() {
    showWaitingGif();
    fetchCategories();
    $("#actionTitle").text("Liste des bookmarks");
    $("#createbookmark").show();
    $("#abort").hide();

    let bookmarks = await API_Getbookmarks();
    eraseContent();

    if (bookmarks !== null) {
        let filteredBookmarks = selectedCategory !== ""
            ? bookmarks.filter(bookmark => bookmark.Category === selectedCategory)
            : bookmarks;

        if (filteredBookmarks.length === 0) {
            $("#content").append("<div>Aucun bookmark dans cette catégorie.</div>");
        } else {
            filteredBookmarks.forEach(bookmark => {
                $("#content").append(renderbookmark(bookmark));
            });
        }

        restoreContentScrollPosition();

        // Attached click events on command icons
        $(".editCmd").on("click", function () {
            saveContentScrollPosition();
            renderEditbookmarkForm(parseInt($(this).attr("editbookmarkId")));
        });
        $(".deleteCmd").on("click", function () {
            saveContentScrollPosition();
            renderDeletebookmarkForm(parseInt($(this).attr("deletebookmarkId")));
        });
        $(".bookmarkRow").on("click", function (e) { e.preventDefault(); });
    } else {
        renderError("Service introuvable");
    }
}

let selectedCategory = "";
function updateDropDownMenu(categories) {
    let DDMenu = $("#DDMenu");
    let selectClass = selectedCategory === "" ? "fa-check" : "fa-fw";
    DDMenu.empty();
    DDMenu.append($(`
        <div class="dropdown-item menuItemLayout" id="allCatCmd">
        <i class="menuIcon fa ${selectClass} mx-2"></i> Toutes les catégories
        </div>
        `));
    DDMenu.append($(`<div class="dropdown-divider"></div>`));
    categories.forEach(category => {
        selectClass = selectedCategory === category ? "fa-check" : "fa-fw";
        DDMenu.append($(`
            <div class="dropdown-item menuItemLayout category" id="allCatCmd">
            <i class="menuIcon fa ${selectClass} mx-2"></i> ${category}
            </div>
            `));
    })
    DDMenu.append($(`<div class="dropdown-divider"></div> `));
    DDMenu.append($(`
        <div class="dropdown-item menuItemLayout" id="aboutCmd">
        <i class="menuIcon fa fa-info-circle mx-2"></i> À propos...
        </div>
        `));
    $('#aboutCmd').on("click", function () {
        renderAbout();
    });
    $('#allCatCmd').on("click", function () {
        selectedCategory = "";
        console.log(selectedCategory);
        renderbookmarks();
    });
    $('.category').on("click", function () {
        selectedCategory = $(this).text().trim();
        console.log(selectedCategory);
        renderbookmarks();

    });
}

function showWaitingGif() {
    $("#content").empty();
    $("#content").append($("<div class='waitingGifcontainer'><img class='waitingGif' src='Loading_icon.gif' /></div>'"));
}
function eraseContent() {
    $("#content").empty();
}
function saveContentScrollPosition() {
    contentScrollPosition = $("#content")[0].scrollTop;
}
function restoreContentScrollPosition() {
    $("#content")[0].scrollTop = contentScrollPosition;
}
function renderError(message) {
    eraseContent();
    $("#content").append(
        $(`
            <div class="errorContainer">
                ${message}
            </div>
        `)
    );
}
function renderCreatebookmarkForm() {
    renderbookmarkForm();
}
async function renderEditbookmarkForm(id) {
    showWaitingGif();
    let bookmark = await API_Getbookmark(id);
    if (bookmark !== null)
        renderbookmarkForm(bookmark);
    else
        renderError("bookmark introuvable!");
}
async function renderDeletebookmarkForm(id) {
    showWaitingGif();
    $("#createbookmark").hide();
    $("#abort").show();
    $("#actionTitle").text("Retrait");
    let bookmark = await API_Getbookmark(id);
    eraseContent();
    if (bookmark !== null) {
        $("#content").append(`
        <div class="bookmarkdeleteForm">
            <h4>Effacer le bookmark suivant?</h4>
            <br>
            <div class="bookmarkRow" bookmark_id=${bookmark.Id}">
                <div class="bookmarkContainer">
                    <div class="bookmarkLayout">
                        <div class="bookmarkName">${bookmark.Title}</div>
                        <div class="bookmarkPhone">${bookmark.Url}</div>
                        <div class="bookmarkEmail">${bookmark.Category}</div>
                    </div>
                </div>  
            </div>   
            <br>
            <input type="button" value="Effacer" id="deletebookmark" class="btn btn-primary">
            <input type="button" value="Annuler" id="cancel" class="btn btn-secondary">
        </div>    
        `);
        $('#deletebookmark').on("click", async function () {
            showWaitingGif();
            let result = await API_Deletebookmark(bookmark.Id);
            if (result)
                renderbookmarks();
            else
                renderError("Une erreur est survenue!");
        });
        $('#cancel').on("click", function () {
            renderbookmarks();
        });
    } else {
        renderError("bookmark introuvable!");
    }
}
function newbookmark() {
    bookmark = {};
    bookmark.Id = 0;
    bookmark.Title = "";
    bookmark.Url = "";
    bookmark.Category = "";
    return bookmark;
}
function renderbookmarkForm(bookmark = null) {
    $("#createbookmark").hide();
    $("#abort").show();
    eraseContent();
    let create = bookmark == null;
    if (create) bookmark = newbookmark();
    $("#actionTitle").text(create ? "Création" : "Modification");
    $("#content").append(`
        <form class="form" id="bookmarkForm">
            <input type="hidden" name="Id" value="${bookmark.Id}"/>

            <label for="Title" class="form-label">Title </label>
            <input 
                class="form-control Alpha"
                name="Title" 
                id="Title" 
                placeholder="Title"
                required
                RequireMessage="Veuillez entrer un title"
                InvalidMessage="Le title comporte un caractère illégal" 
                value="${bookmark.Title}"
            />
            <label for="Url" class="form-label">Url </label>
            <input
                class="form-control Url"
                name="Url"
                id="Url"
                placeholder="exemple.com"
                required
                RequireMessage="Veuillez entrer votre url" 
                InvalidMessage="Veuillez entrer un url valide"
                value="${bookmark.Url}" 
            />
            <label for="Category" class="form-label">Category </label>
            <input 
                class="form-control Alpha"
                name="Category"
                id="Category"
                placeholder="Category"
                required
                RequireMessage="Veuillez la category du site" 
                InvalidMessage="Veuillez entrer une category valide"
                value="${bookmark.Category}"
            />
            <hr>
            <input type="submit" value="Enregistrer" id="savebookmark" class="btn btn-primary">
            <input type="button" value="Annuler" id="cancel" class="btn btn-secondary">
        </form>
    `);
    initFormValidation();
    $('#bookmarkForm').on("submit", async function (event) {
        event.preventDefault();
        let bookmark = getFormData($("#bookmarkForm"));
        bookmark.Id = parseInt(bookmark.Id);
        showWaitingGif();
        let result = await API_Savebookmark(bookmark, create);
        if (result)
            renderbookmarks();
        else
            renderError("Une erreur est survenue!");
    });
    $('#cancel').on("click", function () {
        renderbookmarks();
    });
}

function getFormData($form) {
    const removeTag = new RegExp("(<[a-zA-Z0-9]+>)|(</[a-zA-Z0-9]+>)", "g");
    var jsonObject = {};
    $.each($form.serializeArray(), (index, control) => {
        jsonObject[control.name] = control.value.replace(removeTag, "");
    });
    return jsonObject;
}

function renderbookmark(bookmark) {
    let logo = `https://www.google.com/s2/favicons?sz=64&domain_url=${bookmark.Url}`;
    return $(`
     <div class="bookmarkRow" bookmark_id=${bookmark.Id}">
        <div class="bookmarkContainer noselect">
            <div class="bookmarkLayout">
                <span class="bookmarkName">${bookmark.Title}</span>
                <span class="bookmarkPhone">${bookmark.Url}</span>
                <span class="bookmarkEmail">${bookmark.Category}</span>
            </div>
            <div class="bookmarkCommandPanel">
                <span class="editCmd cmdIcon fa fa-pencil" editbookmarkId="${bookmark.Id}" title="Modifier ${bookmark.Title}"></span>
                <span class="deleteCmd cmdIcon fa fa-trash" deletebookmarkId="${bookmark.Id}" title="Effacer ${bookmark.Title}"></span>
            </div>
        </div>
    </div>           
    `);
}

async function fetchCategories() {
    try {
        let bookmarks = await API_Getbookmarks();
        let categories = [...new Set(bookmarks.map(bookmark => bookmark.Category))];
        updateDropDownMenu(categories);
    } catch (error) {
        console.error("Error fetching bookmarks:", error);
    }
}