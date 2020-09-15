var $msgContainer = $("#msgContainer");
var $editBtn = $("#editBtn");
var $editModal = $("#editModal");
var $editForm = $("#editForm");
var $confirmBtn = $("#confirmBtn");
var $cancelBtn = $("#cancelBtn");


var $msg_temp = $(".msgbox").clone();
$(".msgbox").remove();

// Msg and Modal
$(".closeModal").click(function(){
	$(this).closest(".modal").fadeOut();
});

function openModal($modal){
	$modal.css("display", "flex").hide().fadeIn();
}

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
	//console.log($ele.width());
	$ele.slideDown();
	//if(nav_on)
	//	$ele.css("width", $ele.width()-nav_width);
}

$confirmBtn.click(function(){
	infomsg("Confirmed!");
});

$cancelBtn.click(function(){
	alertmsg("Canceled!");
});

