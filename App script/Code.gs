/* সিরাত কুইজ অলিম্পিয়াড সার্ভার। Sheet > Extensions > Apps Script এ পেস্ট করে Deploy > Web app (Execute as: Me, Access: Anyone)। কোড বদলালে New version দিয়ে আবার Deploy করুন। Web app URL টা config.js এ বসান। */
var SHEET_NAME="Registrations",SESSION_SHEET="Sessions",MAX_TRIES=5,LOCK_MIN=15,DAYS_SHORT=1,DAYS_LONG=30,RESET_MIN=10,SITE="সিরাত কুইজ অলিম্পিয়াড";
var HEADERS=["Timestamp","Candidate ID","Full Name","Institute","Email","Mobile","Class","Category","Gender","Date of Birth","Division","District","Upazila","Password (Hashed)"];
var C_ID=2,C_NAME=3,C_INST=4,C_EMAIL=5,C_MOBILE=6,C_CLASS=7,C_CAT=8,C_GENDER=9,C_DOB=10,C_DIV=11,C_DIST=12,C_UPZ=13,C_PASS=14;
function doGet(){return reply(true,"Seerah Quiz Olympiad server is running.");}
function doPost(e){
 try{
  var d=JSON.parse(e.postData.contents),a=d.action||"register";
  if(a==="register")return register(d);
  if(a==="login")return login(d);
  if(a==="profile")return profile(d);
  if(a==="logout"){deleteSession(d.token);return reply(true,"ok");}
  if(a==="requestReset")return requestReset(d);
  if(a==="resetPassword")return resetPassword(d);
  return reply(false,"অজানা অনুরোধ।");
 }catch(err){return reply(false,"সার্ভারে সমস্যা হয়েছে, একটু পরে আবার চেষ্টা করুন।");}
}
function register(d){
 var problem=checkRegistration(d);
 if(problem)return reply(false,problem);
 var lock=LockService.getScriptLock();
 lock.waitLock(20000);
 try{
  var sheet=getSheet(),dup=findDuplicate(sheet,d.email,d.mobile);
  if(dup)return reply(false,dup);
  var id=makeCandidateId();
  var row=[Utilities.formatDate(new Date(),"Asia/Dhaka","yyyy-MM-dd HH:mm:ss"),id,d.name,d.inst,String(d.email).trim().toLowerCase(),d.mobile,d.cls,d.category,d.gender,d.dob,d.division,d.district,d.upazila,hashPassword(d.password)];
  var r=sheet.getLastRow()+1;
  sheet.getRange(r,1,1,HEADERS.length).setNumberFormat("@");
  sheet.getRange(r,1,1,HEADERS.length).setValues([row]);
  return reply(true,"ok",{candidateId:id});
 }finally{lock.releaseLock();}
}
function login(d){
 var id=String(d.id||"").trim(),pass=String(d.password||"");
 if(id===""||pass==="")return reply(false,"আইডি ও পাসওয়ার্ড দিন।");
 var cache=CacheService.getScriptCache(),key="fail_"+shortHash(id.toLowerCase()),fails=Number(cache.get(key))||0;
 if(fails>=MAX_TRIES)return reply(false,"অনেকবার ভুল হয়েছে। "+LOCK_MIN+" মিনিট পরে চেষ্টা করুন।");
 var user=findUser(getSheet(),id);
 if(!user||!verifyPassword(user.values[C_PASS-1],pass)){
  cache.put(key,String(fails+1),LOCK_MIN*60);
  var left=MAX_TRIES-(fails+1);
  if(left<=0)return reply(false,MAX_TRIES+" বার ভুল হয়েছে। "+LOCK_MIN+" মিনিট অপেক্ষা করুন।");
  return reply(false,"আইডি বা পাসওয়ার্ড ভুল। বাকি চেষ্টা: "+left);
 }
 cache.remove(key);
 var cid=user.values[C_ID-1];
 return reply(true,"ok",{token:createSession(cid,d.remember?DAYS_LONG:DAYS_SHORT),name:user.values[C_NAME-1],candidateId:cid});
}
function profile(d){
 var cid=getSession(d.token);
 if(!cid)return reply(false,"সেশন শেষ হয়ে গেছে। আবার লগইন করুন।");
 var user=findUser(getSheet(),cid);
 if(!user)return reply(false,"অ্যাকাউন্ট খুঁজে পাওয়া যায়নি।");
 var v=user.values;
 return reply(true,"ok",{candidateId:v[C_ID-1],name:v[C_NAME-1],inst:v[C_INST-1],email:v[C_EMAIL-1],mobile:v[C_MOBILE-1],cls:v[C_CLASS-1],category:v[C_CAT-1],gender:v[C_GENDER-1],dob:v[C_DOB-1],division:v[C_DIV-1],district:v[C_DIST-1],upazila:v[C_UPZ-1]});
}
function requestReset(d){
 var id=String(d.id||"").trim();
 if(id==="")return reply(false,"মোবাইল বা ইমেইল দিন।");
 var cache=CacheService.getScriptCache(),cool="cool_"+shortHash(id.toLowerCase());
 if(cache.get(cool))return reply(false,"একটু অপেক্ষা করুন, ৬০ সেকেন্ড পরে আবার চেষ্টা করুন।");
 cache.put(cool,"1",60);
 var user=findUser(getSheet(),id);
 if(user){
  var cid=user.values[C_ID-1],code=String(Math.floor(100000+Math.random()*900000));
  cache.put("reset_"+cid,shortHash(code+cid),RESET_MIN*60);
  cache.remove("resetfail_"+cid);
  MailApp.sendEmail({to:user.values[C_EMAIL-1],subject:SITE+" - পাসওয়ার্ড রিসেট কোড",body:"আসসালামু আলাইকুম "+user.values[C_NAME-1]+",\n\nআপনার পাসওয়ার্ড রিসেট কোড: "+code+"\n\nএই কোড "+RESET_MIN+" মিনিট পর্যন্ত কাজ করবে।\nআপনি এই অনুরোধ না করে থাকলে এই ইমেইল উপেক্ষা করুন।\n\n"+SITE});
 }
 return reply(true,"ok");
}
function resetPassword(d){
 var id=String(d.id||"").trim(),code=String(d.code||"").trim(),np=String(d.newPassword||"");
 if(id===""||code==="")return reply(false,"কোড দিন।");
 var bad=checkPassword(np);
 if(bad)return reply(false,bad);
 var sheet=getSheet(),user=findUser(sheet,id);
 if(!user)return reply(false,"কোড ভুল বা মেয়াদ শেষ।");
 var cid=user.values[C_ID-1],cache=CacheService.getScriptCache(),fails=Number(cache.get("resetfail_"+cid))||0;
 if(fails>=5)return reply(false,"অনেকবার ভুল কোড দিয়েছেন। নতুন কোড চেয়ে নিন।");
 var saved=cache.get("reset_"+cid);
 if(!saved||saved!==shortHash(code+cid)){
  cache.put("resetfail_"+cid,String(fails+1),RESET_MIN*60);
  return reply(false,"কোড ভুল বা মেয়াদ শেষ।");
 }
 var lock=LockService.getScriptLock();
 lock.waitLock(20000);
 try{
  sheet.getRange(user.rowNumber,C_PASS).setValue(hashPassword(np));
  cache.remove("reset_"+cid);
  cache.remove("resetfail_"+cid);
  deleteSessionsOf(cid);
 }finally{lock.releaseLock();}
 return reply(true,"ok");
}
function reply(success,message,extra){
 var r={success:success,message:message};
 for(var k in extra||{})r[k]=extra[k];
 return ContentService.createTextOutput(JSON.stringify(r)).setMimeType(ContentService.MimeType.JSON);
}
function checkPassword(p){
 if(p.length<8||!/[a-z]/.test(p)||!/[A-Z]/.test(p)||!/[0-9]/.test(p))return "পাসওয়ার্ড কমপক্ষে ৮ অক্ষর, বড়/ছোট হাতের অক্ষর ও সংখ্যা সহ হতে হবে।";
 return "";
}
function checkRegistration(d){
 var need=["name","inst","email","mobile","password","cls","category","gender","dob","division","district","upazila"];
 for(var i=0;i<need.length;i++){
  var v=d[need[i]];
  if(v===undefined||v===null||String(v).trim()==="")return "সব তথ্য পূরণ করুন।";
 }
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(d.email))return "সঠিক ইমেইল দিন।";
 if(!/^01[3-9][0-9]{8}$/.test(d.mobile))return "সঠিক মোবাইল নম্বর দিন।";
 return checkPassword(String(d.password));
}
function getSheet(){
 var ss=SpreadsheetApp.getActiveSpreadsheet(),sh=ss.getSheetByName(SHEET_NAME)||ss.insertSheet(SHEET_NAME);
 if(sh.getLastRow()===0){
  sh.getRange(1,1,1,HEADERS.length).setValues([HEADERS]).setFontWeight("bold");
  sh.setFrozenRows(1);
 }
 return sh;
}
function getSessionSheet(){
 var ss=SpreadsheetApp.getActiveSpreadsheet(),sh=ss.getSheetByName(SESSION_SHEET);
 if(!sh){
  sh=ss.insertSheet(SESSION_SHEET);
  sh.getRange(1,1,1,3).setValues([["Token (Hashed)","Candidate ID","Expires (ms)"]]).setFontWeight("bold");
  sh.setFrozenRows(1);
 }
 return sh;
}
function findUser(sheet,identifier){
 var last=sheet.getLastRow();
 if(last<2)return null;
 var rows=sheet.getRange(2,1,last-1,HEADERS.length).getValues(),id=String(identifier).trim(),lo=id.toLowerCase(),up=id.toUpperCase();
 for(var i=0;i<rows.length;i++){
  var r=rows[i];
  if(String(r[C_ID-1]).toUpperCase()===up||String(r[C_EMAIL-1]).toLowerCase()===lo||String(r[C_MOBILE-1])===id)return {rowNumber:i+2,values:r};
 }
 return null;
}
function findDuplicate(sheet,email,mobile){
 var last=sheet.getLastRow();
 if(last<2)return "";
 var em=sheet.getRange(2,C_EMAIL,last-1,1).getValues(),mo=sheet.getRange(2,C_MOBILE,last-1,1).getValues(),e=String(email).trim().toLowerCase();
 for(var i=0;i<em.length;i++){
  if(String(em[i][0]).toLowerCase()===e)return "এই ইমেইল দিয়ে আগেই রেজিস্ট্রেশন করা হয়েছে।";
  if(String(mo[i][0])===String(mobile))return "এই মোবাইল নম্বর দিয়ে আগেই রেজিস্ট্রেশন করা হয়েছে।";
 }
 return "";
}
function makeCandidateId(){
 var p=PropertiesService.getScriptProperties(),n=(Number(p.getProperty("lastCandidateNumber"))||0)+1,s=String(n);
 p.setProperty("lastCandidateNumber",s);
 while(s.length<5)s="0"+s;
 return "SQO-"+s;
}
function sha256(text){
 var bytes=Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,text,Utilities.Charset.UTF_8),hex="";
 for(var i=0;i<bytes.length;i++){
  var h=(bytes[i]<0?bytes[i]+256:bytes[i]).toString(16);
  hex+=h.length<2?"0"+h:h;
 }
 return hex;
}
function shortHash(t){return sha256(t).slice(0,32);}
function hashPassword(p){
 var salt=Utilities.getUuid().replace(/-/g,"").slice(0,16);
 return salt+":"+sha256(salt+p);
}
function verifyPassword(stored,p){
 var parts=String(stored).split(":");
 return parts.length===2&&sha256(parts[0]+p)===parts[1];
}
function createSession(cid,days){
 var token=Utilities.getUuid()+Utilities.getUuid(),expires=new Date().getTime()+days*86400000,lock=LockService.getScriptLock();
 lock.waitLock(20000);
 try{
  var sh=getSessionSheet(),r=sh.getLastRow()+1;
  sh.getRange(r,1,1,3).setNumberFormat("@");
  sh.getRange(r,1,1,3).setValues([[sha256(token),cid,String(expires)]]);
  if(Math.random()<0.05)cleanExpiredSessions(sh);
 }finally{lock.releaseLock();}
 return token;
}
function getSession(token){
 if(!token)return "";
 var sh=getSessionSheet(),last=sh.getLastRow();
 if(last<2)return "";
 var rows=sh.getRange(2,1,last-1,3).getValues(),hash=sha256(String(token));
 for(var i=0;i<rows.length;i++){
  if(rows[i][0]===hash)return Number(rows[i][2])>new Date().getTime()?rows[i][1]:"";
 }
 return "";
}
function deleteSession(token){
 if(!token)return;
 var lock=LockService.getScriptLock();
 lock.waitLock(20000);
 try{
  var sh=getSessionSheet(),hash=sha256(String(token));
  for(var r=sh.getLastRow();r>=2;r--){
   if(sh.getRange(r,1).getValue()===hash)sh.deleteRow(r);
  }
 }finally{lock.releaseLock();}
}
function deleteSessionsOf(cid){
 var sh=getSessionSheet();
 for(var r=sh.getLastRow();r>=2;r--){
  if(sh.getRange(r,2).getValue()===cid)sh.deleteRow(r);
 }
}
function cleanExpiredSessions(sh){
 var now=new Date().getTime();
 for(var r=sh.getLastRow();r>=2;r--){
  if(Number(sh.getRange(r,3).getValue())<now)sh.deleteRow(r);
 }
}
