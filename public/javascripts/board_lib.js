function check_route(from,to){
  // 출도착 노선에 따른 클래스 설정용
  // 국내선 => kor, 일본노선 => jpn, 기타 => oth
  let info = {
    kor:['GMP','CJU','CJJ','PUS','KUV','ICN'],
    jpn:['NRT','KIX','OKA','FUK','CTS','KOJ','KMI']
  }
  if(info.kor.includes(from) && info.kor.includes(to)){
    return 'kor';
  }else if (info.jpn.includes(from) || info.jpn.includes(to)) {
    return 'jpn';
  }else{
    return 'oth';
  }
  return 'oth';
}
// Check LOV Code
let check_lov = new function(){
  this.lov_code = [
      [0,'DAY CHK'],      [1,'INT CHK'],
      [2,'PHS CHK'],      [3,'BASE CHK'],
      [4,'ENG Change'],   [5,'APU Change'],
      [6,'AD/SB'],        [7,'Special CHK'],
  ];
  
  this.value = (cd)=>{
      let filter = this.lov_code.filter(e=> { return e[0] === parseInt(cd) });
      if(filter.length > 0){
          return filter[0][1]
      }else{
          return undefined
      }
  }
  this.code = (v)=>{
      let filter = this.lov_code.filter(e=> { return e[1] === v });
      if(filter.length > 0){
          return filter[0][0]
      }else{
          return undefined
      }
  }
  this.values = ()=>{
      return this.lov_code.map(e=>{return e[1]});
  }
  this.codes = ()=>{
      return this.lov_code.map(e=>{return e[0]});
  }
  this.table = ()=>{return this.lov_code.slice()};
}();

//raw svg loader
function loadSVG(svgData){
    while(!d3.select(svgData).selectAll('path').empty()){
        d3.select('svg').node().appendChild(
            d3.select(svgData).select('path').node());
    }
    d3.selectAll('path').attr('transform','translate(50,50)');
};

// mouse pop up bubble window.
// x,y - 화면 위치, callback - 정보처리 함수
function bubble_show(x,y,callback){
  //console.log('show');
  d3.select('#tooltip_div').transition().duration(200)
    .style("opacity", .9);
  d3.select('#tooltip_div')
     .style("left", x + "px")
     .style("top", y + "px")
     .html(callback());
}
function bubble_hide(){
  //console.log('hide');
  d3.select('#tooltip_div').transition().duration(500).style("opacity", 0);
}
// shwo msg tooltip - tooltip callback
// return attribute msg-tooltip value
function show_msg(msg){
  //console.log(msg);
  return function(){
    return '<p>'+msg+'</p>';
  }
}
// DB Time -> postion
//t : DB Time format YYYY-MM-DDTHH:MI~~
function rtime_to_time(rtime){
  return rtime.replace('T',' ').substring(0,16);
}
function rtime_to_postion(rtime){
  //console.log(rtime);
  return x_scale(parseTime(rtime_to_time(rtime)));

}
// ACNumber -> position
function acnumber_to_postion(acnum){
  return y_scale(hl_map[acnum])
}
function yyyymmdd(date,del="-")
{
  // Date => YYYY-MM-DD 형식의 문자열로
  var sYear = date.getFullYear();
  var sMonth = date.getMonth() + 1;
  var sDate = date.getDate();

  sMonth = sMonth > 9 ? sMonth : "0" + sMonth;
  sDate  = sDate > 9 ? sDate : "0" + sDate;
  return sYear + del + sMonth + del + sDate;
}
// svg lib
// initialize svg
function init_draw(w,h){
  return d3.select("svg").attr("width",w).attr("height",h);
}
// domain extent와 range extent를 이용하여 linear scale 생성
function linear_scale(d_extent,r_extent){
  return d3.scaleLinear().domain(d_extent).range(r_extent);
}
// r,x,y 값 형태의 데이터를 받아 color 로 circle plot
function draw_circle(p_obj,cname,cdata,ccolor){
  p_obj.append("g").selectAll(cname).data(cdata).enter()
    .append("circle").attr("class",cname+"_circle")
    .attr("r",function(d){ return d.r;})
    .attr("cx",function(d){return d.x;})
    .attr("cy",function(d){return d.y;})
    .attr("fill",ccolor);
}

// x,y,width,height 값 형태의 데이터를 box plot
function draw_box(p_obj,cname,cdata){
  var box_g = p_obj.append("g").attr("class","box").attr("id",cname)
    .attr("transform", "translate("+cdata.x+","+(cdata.y-box_h)+")");
  box_g.append("rect").attr("id",cname+"_rect").attr("class",check_route(cdata.from,cdata.to))//.attr("class","range")
    .attr("width",cdata.width).attr("height",cdata.height)
    //.attr("y",-cdata.height/2)//.attr("x",-cdata.width/2)
    .attr("info",cdata.info);
  return box_g;
}
function draw_line(p_obj,x1,x2,y1,y2){
  return p_obj.append("line").attr("class","box_line")
    .attr("x1",x1).attr("x2",x2).attr("y1",y1).attr("y2",y2);
}
function draw_text(p_obj,x,y,text,cls="draw_text"){
  return p_obj.append("text").attr("class",cls)
    .attr("x",x).attr("y",y).text(text);
}
