/**
 * 이 파일은 미니톡 클라이언트의 일부입니다. (https://www.minitalk.io)
 *
 * 미니톡 채팅위젯 접속자 및 나의 정보와 관련된 부분을 처리한다.
 * 
 * @file /scripts/widget.user.js
 * @author Arzz (arzz@arzz.com)
 * @license MIT License
 * @version 6.4.0
 * @modified 2020. 12. 7.
 */
Minitalk.user = {
	menus:[],
	usersSort:[],
	users:{},
	isVisibleUsers:false,
	latestRefreshTime:0, // 접속자목록을 마지막으로 갱신한 시각
	me:{},
	/**
	 * 나의정보를 초기화한다.
	 */
	init:function() {
		var storeMe = Minitalk.storage("me");
		
		if (storeMe == null) {
			this.me = {id:"",nickname:Minitalk.nickname,nickcon:Minitalk.nickcon,sns:Minitalk.sns,device:Minitalk.device,info:Minitalk.info,status:Minitalk.status,opper:""};
		} else {
			this.me = storeMe;
			this.me.device = Minitalk.device;
			if (Minitalk.nickname) this.me.nickname = Minitalk.nickname;
			if (Minitalk.nickcon) this.me.nickcon = Minitalk.nickcon;
			if (Minitalk.info && typeof Minitalk.info == "object") this.me.info = Minitalk.info;
		}
		
		Minitalk.user.initMenus();
	},
	/**
	 * 유저메뉴를 초기화한다.
	 */
	initMenus:function() {
		Minitalk.user.menus = [{
			icon:"icon_myinfo.png",
			text:Minitalk.getText("usermenu/myinfo"),
			viewMenu:function(minitalk,user,myinfo) {
				if (user.nickname == myinfo.nickname) return true;
				else return false;
			},
			fn:function(minitalk,user,myinfo) {
				$(".userInfoNickname").val(minitalk.user.me.nickname);
				if (minitalk.isNickname == false || minitalk.isPrivate == true) $(".userInfoNickname").attr("disabled",true);
				else $(".userInfoNickname").attr("disabled",false);
				$(".userInfoStatusIcon").css("backgroundImage","url("+minitalk.statusIconPath+"/"+minitalk.user.me.device+"/"+minitalk.user.me.status+".png)");
				$(".userInfoStatusText").text(Minitalk.getText("status/"+minitalk.user.me.status));
				$(".userInfoStatus").attr("status",minitalk.user.me.status);
				$(".userInfoLayer").fadeIn();
			}
		},{
			icon:"icon_whisper.png",
			text:Minitalk.getText("usermenu/whisper"),
			viewMenu:function(minitalk,user,myinfo) {
				if (user.nickname != myinfo.nickname) return true;
				else return false;
			},
			fn:function(minitalk,user,myinfo) {
				$(".inputText").focus();
				$(".inputText").val("/w "+user.nickname+" ");
			}
		},{
			icon:"icon_call.png",
			text:Minitalk.getText("usermenu/call"),
			viewMenu:function(minitalk,user,myinfo) {
				if (user.nickname != myinfo.nickname) return true;
				else return false;
			},
			fn:function(minitalk,user,myinfo) {
				minitalk.socket.sendCall(user.nickname);
			}
		},{
			icon:"icon_privchannel.png",
			text:Minitalk.getText("usermenu/privchannel"),
			viewMenu:function(minitalk,user,myinfo) {
				if (user.nickname != myinfo.nickname && Minitalk.isPrivate == false) return true;
				else return false;
			},
			fn:function(minitalk,user,myinfo) {
				Minitalk.socket.sendInvite(user.nickname);
			}
		},{
			icon:"icon_banmsg.png",
			text:Minitalk.getText("usermenu/banmsg"),
			viewMenu:function(minitalk,user,myinfo) {
				if (myinfo.opper == "ADMIN" && user.nickname != myinfo.nickname) return true;
				else return false;
			},
			fn:function(minitalk,user,myinfo) {
				minitalk.socket.send("banmsg",{id:user.id,nickname:user.nickname});
			}
		},{
			icon:"icon_showip.png",
			text:Minitalk.getText("usermenu/showip"),
			viewMenu:function(minitalk,user,myinfo) {
				if (myinfo.opper == "ADMIN" && Minitalk.isPrivate == false) return true;
				else return false;
			},
			fn:function(minitalk,user,myinfo) {
				minitalk.socket.send("showip",{id:user.id,nickname:user.nickname});
			}
		},{
			icon:"icon_banip.png",
			text:Minitalk.getText("usermenu/banip"),
			viewMenu:function(minitalk,user,myinfo) {
				if (myinfo.opper == "ADMIN" && user.nickname != myinfo.nickname && Minitalk.isPrivate == false) return true;
				else return false;
			},
			fn:function(minitalk,user,myinfo) {
				minitalk.socket.send("banip",{id:user.id,nickname:user.nickname});
			}
		},{
			icon:"icon_opper.png",
			text:Minitalk.getText("usermenu/opper"),
			viewMenu:function(minitalk,user,myinfo) {
				if (myinfo.opper == "ADMIN" && user.nickname != myinfo.nickname && minitalk.isPrivate == false && user.opper != "ADMIN") return true;
				else return false;
			},
			fn:function(minitalk,user,myinfo) {
				minitalk.socket.send("opper",{id:user.id,nickname:user.nickname});
			}
		},{
			icon:"icon_deopper.png",
			text:Minitalk.getText("usermenu/deopper"),
			viewMenu:function(minitalk,user,myinfo) {
				if (myinfo.opper == "ADMIN" && user.nickname != myinfo.nickname && Minitalk.isPrivate == false && user.opper == "ADMIN") return true;
				else return false;
			},
			fn:function(minitalk,user,myinfo) {
				minitalk.socket.send("deopper",{id:user.id,nickname:user.nickname});
			}
		}];
	},
	/**
	 * 유저가 참여하였을 때
	 *
	 * @param object user 유저정보
	 * @param int usercount 유저수
	 */
	join:function(user,usercount) {
		Minitalk.ui.printUserCount(usercount);
		
		if (Minitalk.viewAlert == true) {
			if (Minitalk.user.checkLimit(Minitalk.viewAlertLimit,user.opper) == true) {
				Minitalk.ui.printMessage("system",Minitalk.getText("action/join").replace("{NICKNAME}","<b><u>"+user.nickname+"</u></b>"));
			}
		}
		
		var sortUserCode = {"ADMIN":"#","POWERUSER":"*","MEMBER":"+","NICKGUEST":"-"};
		
		if (Minitalk.user.isVisibleUsers == true) {
			if (Minitalk.user.checkLimit(Minitalk.viewUserLimit,user.opper) == true) {
				Minitalk.user.usersSort.push("["+(user.opper ? sortUserCode[user.opper] : "")+user.nickname+"]");
				Minitalk.user.users[user.nickname] = user;
				Minitalk.user.usersSort.sort();
				var position = $.inArray("["+(user.opper ? sortUserCode[user.opper] : "")+user.nickname+"]",Minitalk.user.usersSort);

				if ($(".userList > span").length < position) {
					$(".userList").append(Minitalk.user.getTag(user,true));
				} else {
					$($(".userList > span")[position]).after(Minitalk.user.getTag(user,true));
				}
			}
		}
		
		Minitalk.fireEvent("join",[user,usercount]);
	},
	/**
	 * 유저가 종료하였을 때
	 *
	 * @param object user 유저정보
	 * @param int usercount 유저수
	 */
	leave:function(user,usercount) {
		Minitalk.ui.printUserCount(usercount);
		
		if (Minitalk.viewAlert == true) {
			if (Minitalk.user.checkLimit(Minitalk.viewAlertLimit,user.opper) == true) {
				Minitalk.ui.printMessage("system",Minitalk.getText("action/leave").replace("{NICKNAME}","<b><u>"+user.nickname+"</u></b>"));
			}
		}
		
		var sortUserCode = {"ADMIN":"#","POWERUSER":"*","MEMBER":"+","NICKGUEST":"-"};
		
		if (Minitalk.user.isVisibleUsers == true) {
			if (Minitalk.user.checkLimit(Minitalk.viewUserLimit,user.opper) == true) {
				Minitalk.user.usersSort.splice($.inArray("["+(user.opper ? sortUserCode[user.opper] : "")+user.nickname+"]",Minitalk.user.usersSort),1);
				delete Minitalk.user.users[user.nickname];
				$(".userList").find("[code='"+user.nickname+"']").remove();
			}
		}
		
		Minitalk.fireEvent("leave",[user,usercount]);
	},
	/**
	 * 유저정보가 변경되었을 때
	 *
	 * @param object before 변경 전 유저정보
	 * @param object after 변경 후 유저정보
	 */
	change:function(before,after) {
		if (before.nickname == Minitalk.user.me.nickname) {
			Minitalk.user.me = after;
			Minitalk.storage("me",Minitalk.user.me);
			
			if (Minitalk.user.isVisibleUsers == true) {
				$(".userList > span")[0].remove();
				$(".userList").prepend(Minitalk.user.getTag(Minitalk.user.me,true));
			}
			
			Minitalk.ui.initToolButton(true);
		}
		
		if (before.nickname != after.nickname) {
			Minitalk.ui.printMessage("system",Minitalk.getText("action/update_nickname").replace("{BEFORE}","<b><u>"+before.nickname+"</u></b>").replace("{AFTER}","<b><u>"+after.nickname+"</u></b>"));
		}
		
		if (before.status != after.status) {
			Minitalk.ui.printMessage("system",Minitalk.getText("action/update_status").replace("{NICKNAME}","<b><u>"+after.nickname+"</u></b>").replace("{STATUS}","<b><u>"+Minitalk.getText("status/"+after.status)+"</u></b>"));
		}
		
		var sortUserCode = {"ADMIN":"#","POWERUSER":"*","MEMBER":"+","NICKGUEST":"-"};
		
		if (Minitalk.user.isVisibleUsers == true) {
			if ($.inArray("["+before.opper+before.nickname+"]",Minitalk.user.usersSort) >= 0) {
				Minitalk.user.usersSort.splice($.inArray("["+(before.opper ? sortUserCode[before.opper] : "")+before.nickname+"]",Minitalk.user.usersSort),1);
			}
			if (Minitalk.user.users[before.nickname] != undefined) {
				delete Minitalk.user.users[before.nickname];
			}
			$(".userList").find("[code='"+before.nickname+"']").remove();
			
			if (Minitalk.user.checkLimit(Minitalk.viewUserLimit,after.opper) == true) {
				Minitalk.user.usersSort.push("["+(after.opper ? sortUserCode[after.opper] : "")+after.nickname+"]");
				Minitalk.user.users[after.nickname] = after;
				Minitalk.user.usersSort.sort();
				var position = $.inArray("["+(after.opper ? sortUserCode[after.opper] : "")+after.nickname+"]",Minitalk.user.usersSort);
				var user = Minitalk.user.getTag(after,true);
				
				if (after.nickname == Minitalk.user.me.nickname) {
					user.css("display","none");
				}
				if ($(".userList > span").length < position) {
					$(".userList").append(user);
				} else {
					$($(".userList > span")[position]).after(user);
				}
			}
		}
	},
	/**
	 * 유저의 고유한 값을 가져온다.
	 */
	getUuid:function() {
		if (Minitalk.storage("uuid") && Minitalk.storage("uuid").length == 32) {
			return Minitalk.storage("uuid");
		} else {
			Minitalk.storage("uuid",Minitalk.uuid);
			return Minitalk.storage("uuid");
		}
	},
	/**
	 * 접속자태그를 가져온다.
	 *
	 * @param object user 유저객체
	 * @param boolean isUserList 접속자목록내인지 여부
	 * @return object $user 접속자태그
	 */
	getTag:function(user,isUserList) {
		var tag = $("<span>").addClass("user");
		tag.data("userinfo",user);
		if (isUserList == true && Minitalk.viewStatusIcon == true) {
			tag.css("paddingLeft",20);
			tag.css("backgroundImage","url("+Minitalk.statusIconPath+"/"+user.device+"/"+user.status+".png)");
		}
		
		if (isUserList == true) {
			tag.on("mouseover",function() {
				$(this).addClass("mouseover");
			});
			tag.on("mouseout",function() {
				$(this).removeClass("mouseover");
			});
		}
		tag.attr("nickname",user.nickname);
		
		var sHTML = "";
		if (user.nickcon != "") {
			var temp = user.nickcon.split(",");
			for (var i=0,loop=temp.length;i<loop;i++) {
				if (temp[i] == "{nickname}") {
					sHTML+= user.nickname;
				} else {
					if (isUserList == true) sHTML+= '<img src="'+temp[i]+'" nickname="'+user.nickname+'" />';
					else sHTML+= '<img src="'+temp[i]+'" nickname="'+user.nickname+'" onload="Minitalk.ui.autoScroll();" />';
				}
			}
		} else {
			sHTML+= user.nickname;
		}
		
		if (isUserList == true && Minitalk.user.me.nickname == user.nickname) {
			sHTML+= "("+Minitalk.getText("text/me")+")";
		} else {
			tag.attr("code",user.nickname);
		}
		
		if (user.opper == "ADMIN") {
			sHTML+= '<img src="'+Minitalk.getTempletUrl(Minitalk.templet)+'/images/icon_admin.gif" />';
		}
		tag.html(sHTML);
		tag.on("click",function(e) {
			Minitalk.user.toggleMenu($(this).data().userinfo,e);
		});
		return tag;
	},
	/**
	 * 유저메뉴를 추가한다.
	 */
	addMenu:function(usermenu) {
		Minitalk.addUserMenuList.push(usermenu);
	},
	/**
	 * 유저정보를 추가한다.
	 */
	addInfo:function(key,value) {
		if (Minitalk.socket.isConnected() == true) {
			if (!Minitalk.user.me.info || typeof Minitalk.user.me.info != "object") Minitalk.user.me.info = {};
			Minitalk.user.me.info[key] = value;
		} else {
			if (!Minitalk.info || typeof Minitalk.info != "object") Minitalk.info = {};
			Minitalk.info[key] = value;
		}
	},
	/**
	 * 유저메뉴를 토클한다.
	 *
	 * @param object userinfo 유저정보
	 * @param event e
	 */
	toggleMenu:function(userinfo,e) {
		$(".userMenu").html("");
		$(".userMenu").attr("nickname",userinfo.nickname);
		$(".userMenu").data("userinfo",userinfo);
		$(".userMenu").show();
		var width = $(".userMenu").outerWidth(true);
		
		var frameWidth = $(".frame").outerWidth(true);
		var frameHeight = $(".frame").outerHeight(true);
		
		if (e.pageX + width < frameWidth) {
			$(".userMenu").css("left",e.pageX);
			$(".userMenu").css("right","auto");
		} else {
			$(".userMenu").css("left","auto");
			$(".userMenu").css("right",5);
		}
		
		if (e.pageY < frameHeight/2) {
			$(".userMenu").attr("position","top");
			$(".userMenu").css("top",e.pageY);
			$(".userMenu").css("bottom","auto");
		} else {
			$(".userMenu").attr("position","bottom");
			$(".userMenu").css("top","auto");
			$(".userMenu").css("bottom",frameHeight - e.pageY);
		}
		
		$(".userMenu").append($("<div>").addClass("nickname").css("backgroundImage","url("+Minitalk.getUrl()+"/images/loader16.gif)").html(userinfo.nickname));
		
		Minitalk.socket.send("userinfo",{id:userinfo.id,nickname:userinfo.nickname});
	},
	/**
	 * 유저메뉴를 출력한다.
	 *
	 * @param object userinfo 유저정보
	 */
	printMenu:function(userinfo) {
		if ($(".userMenu").css("display") == "none" || $(".userMenu").attr("nickname") != userinfo.nickname) return;
		
		var user = $(".userMenu").data().userinfo;
		user.status = userinfo.status;
		user.opper = userinfo.opper;
		
		$($(".userMenu").find(".nickname")).css("backgroundImage","url("+Minitalk.statusIconPath+"/"+user.device+"/"+user.status+".png)");
		$(".userMenu").append($("<div>").addClass("list").css("overflow","hidden").height(1));
		
		var height = 0;
		for (var i=0, loop=Minitalk.user.menus.length;i<loop;i++) {
			if (typeof Minitalk.user.menus[i].viewMenu !== "function" || Minitalk.user.menus[i].viewMenu(Minitalk,user,Minitalk.user.me) == true) {
				var thisMenu = $("<div>").addClass("menu");
				thisMenu.attr("menuIDX",i);
				thisMenu.data("userinfo",user);
				thisMenu.on("mouseover",function() { $(this).addClass("mouseover"); });
				thisMenu.on("mouseout",function() { $(this).removeClass("mouseover"); });
				thisMenu.on("click",function() {
					var user = $(this).data().userinfo;
					Minitalk.user.menus[parseInt($(this).attr("menuIDX"))].fn(Minitalk,user,Minitalk.user.me);
					$(".userMenu").hide();
				});
				thisMenu.css("backgroundImage","url("+Minitalk.getUrl()+"/templets/"+Minitalk.templet+"/images/"+Minitalk.user.menus[i].icon+")");
				thisMenu.html(Minitalk.user.menus[i].text);

				$($(".userMenu").find(".list")).append(thisMenu);
				height+= thisMenu.outerHeight(true);
			}
		}
		
		for (var i=0, loop=Minitalk.addUserMenuList.length;i<loop;i++) {
			if (typeof Minitalk.addUserMenuList[i].viewMenu !== "function" || Minitalk.addUserMenuList[i].viewMenu(Minitalk,user,Minitalk.user.me) == true) {
				var thisMenu = $("<div>").addClass("menu");
				thisMenu.attr("menuIDX",i);
				thisMenu.data("userinfo",user);
				thisMenu.on("mouseover",function() { $(this).addClass("mouseover"); });
				thisMenu.on("mouseout",function() { $(this).removeClass("mouseover"); });
				thisMenu.on("click",function() {
					var user = $(this).data().userinfo;
					Minitalk.addUserMenuList[parseInt($(this).attr("menuIDX"))].fn(Minitalk,user,Minitalk.user.me);
					$(".userMenu").hide();
				});
				thisMenu.css("backgroundImage","url("+Minitalk.addUserMenuList[i].icon+")");
				thisMenu.html(Minitalk.addUserMenuList[i].text);

				$($(".userMenu").find(".list")).append(thisMenu);
				height+= thisMenu.outerHeight(true);
			}
		}
		
		var frameWidth = $(".frame").outerWidth(true);
		var frameHeight = $(".frame").outerHeight(true);
		var padding = $(".userMenu").outerHeight(true) - $(".userMenu").height();
		
		if (padding + $($(".userMenu").find(".nickname")).outerHeight(true) + height + 10 < frameHeight - parseInt($(".userMenu").css($(".userMenu").attr("position")).replace("px",""))) {
			height = height;
		} else {
			height = frameHeight - padding - $($(".userMenu").find(".nickname")).outerHeight(true) - parseInt($(".userMenu").css($(".userMenu").attr("position")).replace("px","")) - 10;
			$($(".userMenu").find(".list")).css("overflowY","scroll");
		}
		
		$($(".userMenu").find(".list")).animate({height:height},"fast");
	},
	/**
	 * 권한 최소레벨에 해당하는지 확인한다.
	 *
	 * @param string limit 확인할 권한
	 * @param string target 대상권한
	 * @return boolean included 최소레벨을 만족하는지 여부
	 */
	checkLimit:function(limit,target) {
		if (limit == "") limit = "ALL";
		if (target == "") target = "ALL";
		var levels = ["ALL","NICKGUEST","MEMBER","POWERUSER","ADMIN","NONE"];
		
		return $.inArray(limit,levels) <= $.inArray(target,levels);
	},
	/**
	 * 호출을 받았을 때
	 *
	 * @param object from 호출한 사람
	 * @param object to 호출을 받은 사람
	 */
	call:function(from,to) {
		if (from.nickname == Minitalk.user.me.nickname) {
			Minitalk.ui.printMessage("system",Minitalk.getText("action/call").replace("{NICKNAME}","<b><u>"+to.nickname+"</u></b>"));
		} else {
			if (Minitalk.fireEvent("beforeCall",[from,to]) === false) return;
			
			Minitalk.ui.printMessage("system",Minitalk.getText("action/called").replace("{NICKNAME}","<b><u>"+from.nickname+"</u></b>"));
			Minitalk.ui.playSound("call");
			Minitalk.ui.push("[MiniTalk6] "+Minitalk.getText("action/called").replace("{NICKNAME}",from.nickname),"channel : "+Minitalk.channel);
			
			Minitalk.fireEvent("call",[from,to]);
		}
	},
	/**
	 * 개인채널 초대를 받았을 때
	 *
	 * @param object from 초대한 사람
	 * @param object to 초대받은 사람
	 * @param string 개인채널코드
	 */
	invite:function(from,to,code) {
		if (from.nickname == Minitalk.user.me.nickname) {
			Minitalk.ui.printMessage("system",Minitalk.getText("action/invite").replace("{NICKNAME}","<b><u>"+to.nickname+"</u></b>"));
		} else {
			if (Minitalk.fireEvent("beforeInvite",[from,code,to]) === false) return;
			
			var showAlert = Minitalk.ui.showAlert("invite",code,Minitalk.getText("action/invited_detail").replace("{NICKNAME}","<b><u>"+from.nickname+"</u></b>").replace("{TIME}","<b><u>"+Minitalk.ui.getTime(moment().valueOf(),"YYYY.MM.DD HH:mm:ss")+"</u></b>"),false,{from:from,to:to,code:code},function(alert) {
				if (confirm(Minitalk.getText("action/invite_confirm")) == true) {
					return Minitalk.ui.openPrivateChannel("join",alert.data("data"));
				} else {
					Minitalk.socket.send("reject",alert.data("data"));
				}
				return true;
			});
			if (showAlert == true) {
				Minitalk.ui.playSound("query");
				Minitalk.ui.push("[MiniTalk6] "+Minitalk.getText("action/invited").replace("{NICKNAME}",from.nickname),"channel : "+Minitalk.channel);
				Minitalk.ui.printMessage("system",Minitalk.getText("action/invited").replace("{NICKNAME}","<b><u>"+from.nickname+"</u></b>"));
				
				Minitalk.fireEvent("invite",[from,code,to]);
			}
		}
	}
};