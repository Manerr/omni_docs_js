let lastFilePath = null;

let uploadFileInput;

function create8xvFile(title, content)
{
    try
    {

        if (lastFilePath !== null)
        {
            lib.FS.unlink(lastFilePath);
            lastFilePath = null;
        }

        const txt = unescape(encodeURIComponent(content));
        const appvar = lib.TIVarFile.createNew("AppVar", title);
        appvar.setContentFromString(txt);

        const filePath = appvar.saveVarToFile("ODFILES");
        lastFilePath = filePath;

        const file = lib.FS.readFile(filePath, {encoding: 'binary'});
        if (file)
        {
            if (file.byteLength > 65525) {
                alert('Generated file is too big, the calculator can\'t handle so much data.');
                return;
            }
            const blob = new Blob([file], {type: 'application/octet-stream'});

            var blobUrl = URL.createObjectURL(blob);
            var link = document.createElement("a");
            link.href = blobUrl;
            link.download = "ODFILES.8xv";
            link.click();


        } else {
            alert('Couldn\'t generate file correctly.');
        }

    } catch (e)
    {
        alert('Error happened: ' + e.toString());
    }
}


function String2Hex(string){
  let finalString = "";
  for (var i = 0; i < string.length; i++) {
    finalString += string.codePointAt(i).toString(16).padStart(2,"0").toUpperCase();
  }
  return finalString;
}

function Hex2String(string){
  let finalString = "";
  for (var i = 0; i < string.length; i+=2) {
    finalString += String.fromCharCode( parseInt(string.substring(i,i + 2),16) );
    }
  return finalString;
}






function importFile(file){

    let fileNames = file.name.split(".");

    //Not a 8xv
    if( fileNames.length < 2 || fileNames[1] != "8xv" ){
      alert("File not valid | Be sure to upload a 8xv.");
      return false;
    }

    const arrayBuffer = file.arrayBuffer();

    file.arrayBuffer().then(buff => {
        const data = new Uint8Array(buff);

        lib.FS.writeFile('ODFILES.8xv',data);

        const appvar = lib.TIVarFile.loadFromFile('ODFILES.8xv');

        content = appvar.getReadableContent();

        console.log(content);

        //Convert the hex string given by the cpp lib to a readble string then add each "files" content to new tabs
        if(content) importTabs(Hex2String(content));

    });




    return true;
}


function exportBasedOnTabs(e){

  let content = "";

  //No jquery here yet because if prefer my old tricks

  let tabs = document.querySelectorAll("#files textarea");

  for (var i = 0; i < tabs.length; i++) {

    let tabFileName = $("#files .nav-link")[i].innerText;

    content += `\\${tabFileName}\n` + tabs[i].value.replaceAll("é", "\x15");
    if(i < tabs.length + 1) content += "\n";
  }

  console.log(content);
  //Convert them to hex strings, since appvar creation with this lib needs that format
  create8xvFile("ODFILES",String2Hex(content));
}


function importTabs(content){
    console.log(content);

    files = content.split("\\").slice(1);
    if(!files.length) return false

    $(".nav-item.dropdown").remove();
    $("#files .tab-pane").remove();

    for (var i = 0; i < files.length; i++) {
      let file = files[i];
      let tabName = file.substring(file.search("\n"),-1);
      let tabContent = file.substring(file.search("\n") + 1).replaceAll("\x15","é");

      console.log(tabName,tabContent);
      createNewTab();

      document.querySelector(`.nav-link[id=file-${i + 1}-tab]`).innerText = tabName;
      document.querySelector(`textarea[name=file-${i + 1}]`).value = tabContent;

    }



}



    var fileOptions = $("#files-pop-up");
    // fileOptions.hide();

    var fileOptionsSettings = $("#fileOptions"); 

    //Jquery deletes this instance after the first uplaod
    uploadFileInput = document.querySelector("input[type=file]");
    var uploadFileOverlay = $("#file-dialog-overlay");

    var createFileButton = $("#file-create");

    var exportButton = $("#export-link");

    exportButton.on("click",exportBasedOnTabs);


    $("#import-link").on("click",function(e){
      uploadFileInput.click();
    });

    function hideFileOptions(e){
        fileOptions.hide();
    }

    fileOptionsSettings.on("click",function(e){
        if(fileOptions[0].style.display == "none"){
            fileOptions.show();
        }
        else{
            fileOptions.hide();
        }
    });

    $("input[type=file]").on("input",function(e){

        const file = e.target.files[0];
        if (!file) return;
        if(importFile(file)) hideFileOptions();
    });

    createFileButton.on("click",function(e){
        hideFileOptions();
    });




  function getNextTabCounter() {
    let usedIds = [];
    $('#nav-tab .nav-link').each(function () {
      const id = $(this).attr('id');
      const match = id && id.match(/^file-(\d+)-tab$/);
      if (match) {
        usedIds.push(parseInt(match[1], 10)); 
      }
    });

    let counter = 1;
    while (usedIds.includes(counter)) {
      counter++;
    }
    return counter; 
  }

  function createNewTab() {

    const tabCounter = getNextTabCounter(); 
    const tabId = `file-${tabCounter}`;
    const tabName = `${tabCounter}`;

    const newTabButton = `
      <li class="nav-item dropdown">
        <a class="nav-link" id="${tabId}-tab" data-bs-target="#${tabId}" role="tab" aria-controls="${tabId}" aria-selected="false" href="#">
          ${tabName}
        </a>
        <ul class="dropdown-menu">
          <li><a class="dropdown-item rename-tab" href="#" data-tab-id="${tabId}">Rename</a></li>
          <li><a class="dropdown-item delete-tab text-bg-danger" href="#" data-tab-id="${tabId}">Delete</a></li>
        </ul>
      </li>
    `;

    const newTabPane = `
      <div class="tab-pane fade h-100" id="${tabId}" role="tabpanel" aria-labelledby="${tabId}-tab">
        <textarea class="form-control" placeholder="File-${tabName} content" name="${tabId}"></textarea>
      </div>
    `;

    $('#new-file-link').parent().before(newTabButton);
    $('#nav-tabContent').append(newTabPane);


    const newTab = document.querySelector(`#${tabId}-tab`);
    bootstrap.Tab.getOrCreateInstance(newTab).show();

    bindDropdownBehavior(`#${tabId}-tab`);
  }


  function bindDropdownBehavior(selector) {
    const $tab = $(selector);
    $tab.on('click', function (e) {
      e.preventDefault(); // Prevent default link behavior
      const isActive = $(this).hasClass('active');
      const $dropdownMenu = $(this).next('.dropdown-menu');

      if (isActive) {
        // If active, toggle dropdown
        $dropdownMenu.toggleClass('show');
      } else {
        // If not active, switch to tab and close dropdown
        bootstrap.Tab.getOrCreateInstance(this).show();
        $dropdownMenu.removeClass('show');
      }
    });
  }



  $('#new-file-link').on('click', function (e) {
    e.preventDefault();
    createNewTab();
  });

  $('#nav-tab').on('click', '.delete-tab', function (e) {
    e.preventDefault();
    if(!confirm("Are you sure to delete this file/tab ?")){  
      $(this).closest(".dropdown-menu").removeClass("show");
      return;
    }

    const tabId = $(this).data('tab-id');
    const $tab = $(`#${tabId}-tab`);
    const $tabPane = $(`#${tabId}`);

    if ($tab.hasClass('active')) {
      const $otherTabs = $('#nav-tab .nav-link').not(`#${tabId}-tab`);
      if ($otherTabs.length > 0) {
        bootstrap.Tab.getOrCreateInstance($otherTabs.first()[0]).show();
      }
    }


    $tab.closest('.nav-item').remove();
    $tabPane.remove();
  });

  $('#nav-tab').on('click', '.rename-tab', function (e) {
    e.preventDefault();
    const tabId = $(this).data('tab-id');
    const $tab = $(`#${tabId}-tab`);
    $tab.trigger('dblclick');
  });




  $('#nav-tab').on('dblclick', '.nav-link', function (e) {
    e.preventDefault();
    if ($(this).attr('id') === 'new-file-link') {
      return;
    }

    var name = $(this).text().replaceAll("\n","").replaceAll(" ","").replaceAll("\t","");//Fixing a quite dumb issue

    var newname = prompt("Rename '" + name + "' to: ");
    if (newname && newname.length > 0) {
      newname = newname.substring(0, 8)
      $(this).text(newname);
    }
  });



  $(document).on('click', function (e) {
    const $dropdownTabs = $('.nav-item.dropdown .nav-link');
    const $dropdownMenus = $('.dropdown-menu');
    if (!$dropdownTabs.is(e.target) && !$dropdownMenus.is(e.target) && $dropdownMenus.has(e.target).length === 0) {
      $dropdownMenus.removeClass('show');
    }
  });

  $('#nav-tab').on('shown.bs.tab', '.nav-link', function () {
    $('.dropdown-menu').removeClass('show');
  });


