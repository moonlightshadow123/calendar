var $msgContainer = $("#msgContainer");
var $editBtn = $("#editBtn");
var $editModal = $("#editModal");
var $editForm = $("#editForm");
var $confirmBtn = $("#confirmBtn");
var $cancelBtn = $("#cancelBtn");
var $dialogModal = $("#dialogModal");
var $dialogConfirm = $("#dialogConfirm"); 
var $dialogCancel = $(".dialogCancel");


var $msg_temp = $(".msgbox").clone();
$(".msgbox").remove();

//Modal
$(".closeModal").click(function(){
	$(this).closest(".modal").fadeOut();
});

function openModal($modal, header=""){
	$modal.css("display", "flex").hide().fadeIn();
	if(header != "")
		$modal.find(".header").html(header);
}

$confirmBtn.click(function(){
	infomsg("Confirmed!");
});

$cancelBtn.click(function(){
	alertmsg("Canceled!");
});

// Msg

$("body").on("click", ".closeMsg", function(){
	$(this).closest(".msgbox").slideUp();
});

function infomsg(msg){
	openmsg(msg, "msginfo");
}

function alertmsg(msg){
	openmsg(msg, "msgalert");
}

function openmsg(msg, classname){
	$ele = $msg_temp.clone();
	$msgContainer.prepend($ele);
	$ele.addClass(classname).find(".msg").html(msg);
	$ele.slideDown();
}
//// dialog

var confirmCBK;
var cancelCBK;

$dialogConfirm.click(function(event){
	if(confirmCBK!=null)
		confirmCBK();
});

$dialogCancel.click(function(event){
	if(cancelCBK!=null)
		cancelCBK();
});

function dialogPop(msg, callback, callback2=null){
	$dialogModal.find(".msg").html(msg);
	openModal($dialogModal);
	confirmCBK = callback;
	cancelCBK = callback2;
}

