// init value
var svg_w = 1750;//board size
var svg_h_unit = 30;//adjust board height
var pad_left = 80, pad_right = 250, pad_top = 30, pad_bottom = 30;
var box_h = 55;
var box_min = 68; // min width of box
var msg_mark = '@';//text icon

// time scale
var xscale_start = '04:00';
var xscale_end = '29:00'; //05시
var xscale_ticks = 28; //x축의 갯수
var parseTime = d3.timeParse("%Y-%m-%d %H:%M");

// svg 객체
var svg = null;

// Scale 객체
var x_scale = null;
var y_scale = null;

// HLNumber 표시
var hl_map = {};

// event function -- ajax
function select_event(){
  var sel_date = d3.select('#log_date').property('value');
  var sel_station = d3.select('#station').property('value');
  var json_url = '/flight_plan/'+sel_date+'/'+sel_station;
  d3.json(json_url,function(err,data){
    if(err){
      console.log(err);
      //console.log(data);
      alert('Server Internal Error, please email to system administrator!')
    }else{
      //console.log(data.plan);
      plot_data = data.plan;
      draw_plot(sel_date,data.plan);
    }
  });
}

// event function -- reload
function flight_board(){
  var sel_date = d3.select('#log_date').property('value');
  var sel_station = d3.select('#station').property('value');
  var url = "/flight_board/" + sel_date + "/" + sel_station;
  //alert(url);
   $(location).attr('href', url);
   window.location = url;
}

// draw board
function draw_plot(sel_date,sel_station,draw_data){
  console.log('draw_plot');
  // check sel_station => set xscale_start, xscale_end
  // ALL,ICN => 
  //console.log(sel_station);
  if(['CJU','KUV','GMP'].indexOf(sel_station) >= 0){
    xscale_start = '06:00';
    xscale_end = '24:00';
    xscale_ticks = 18;
  }else{
    xscale_start = '04:00';
    xscale_end = '29:00';
    xscale_ticks = 28;
  }
  
  //console.log(draw_data);
    // https://github.com/wbkd/d3-extended
    d3.selection.prototype.moveToFront = function() {  
      return this.each(function(){
        this.parentNode.appendChild(this);
      });
    };
    d3.selection.prototype.moveToBack = function() {  
        return this.each(function() { 
            var firstChild = this.parentNode.firstChild; 
            if (firstChild) { 
                this.parentNode.insertBefore(this, firstChild); 
            } 
        });
    };
  
  var hl_set = new Set();
  draw_data.forEach(function(d){
    //ACNumber != null and ACNumber.length != 0
    //console.log(d.ACNumber);
    if(d.ACNumber != null && d.ACNumber.length > 0){
      hl_set.add(d.ACNumber);
    }
  });
  // y scale size 조정, hl# list 갯수만큼 생성 할 수 있도록
  var svg_height = (box_h+svg_h_unit)*(hl_set.size) + pad_top+pad_bottom;

  svg = init_draw(svg_w,svg_height);
  svg.selectAll("g").remove();


  var x_extent = [parseTime(sel_date +' '+xscale_start),parseTime(sel_date +' '+xscale_end)];
  var y_extent = [0,hl_set.size];
  x_scale = d3.scaleTime().range([pad_left,svg_w-pad_right])
      .domain(x_extent).clamp(true);// 값 범위 초과시 처리 옵션
  var x_axis = d3.axisTop(x_scale)
    .tickFormat(d3.timeFormat("%H:%M")) //24시간 형식
    .tickSize(-(svg_height-pad_top-pad_bottom)).ticks(xscale_ticks);
  y_scale = linear_scale(y_extent,[pad_bottom,svg_height-pad_top]);
  var y_axis =  d3.axisLeft(y_scale).tickSize(-(svg_w-pad_left-pad_right)).ticks(hl_set.size);

  //x 축 그리기
  svg.append("g").attr("class", "x_axis")
    .attr("transform", "translate(0," + pad_top + ")").call(x_axis);
  // y 축 그리기
  svg.append("g").attr("id","y_axis")
    .attr("transform","translate("+pad_left+","+0+")").call(y_axis);
  // HLNumber 표시
  hl_map = {};
  var i = 1;
  Array.from(hl_set).sort().forEach(function(d){
    let hl_g = svg.append("g").attr('id',d);
    draw_text(hl_g,0,y_scale(i)-box_h/2,d)
      .attr('id','ACNumber').attr("font-size",18);
    //Flight Detail info : ACModel, ACSerialNumber
    draw_text(hl_g,0,y_scale(i)-box_h/2+12,'EffectivityIPC')
      .attr('id','EffectivityIPC').attr("font-size",14);
    draw_text(hl_g,0,y_scale(i)-box_h/2+24,'Wheel')
      .attr('id','Wheel').attr("font-size",14);
    hl_map[d] = i;
    i++;
  });
  //read detail for hl and show
  d3.json('/info/flight_info',(err,data)=>{
    //console.log(data);
    data.data.recordsets[0].forEach((d)=>{
      //console.log(d.LineNumber,d.EffectivityIPC);
  	   if(hl_set.has(d.ACNumber)){
         d3.select('#'+d.ACNumber).select('#EffectivityIPC').text(d.EffectivityIPC);
         d3.select('#'+d.ACNumber).select('#Wheel').text(d.Wheel);
       }
     });
  });

  //플라이트 정보 박스를 그려준다.
  draw_data.forEach(function(d){
    if(d.ACNumber == null || d.ACNumber.length <= 0){ return }
    var start_time = d.StandardTimeDeparture.replace('T',' ').substring(0,16);
    var end_time = d.StandardTimeArrival.replace('T',' ').substring(0,16);
    var x1 = rtime_to_postion(d.StandardTimeDeparture);//x_scale(parseTime(start_time));
    var x2 = rtime_to_postion(d.StandardTimeArrival);//x_scale(parseTime(end_time));
    var y = acnumber_to_postion(d.ACNumber);// y_scale(hl_map[d.ACNumber])

    var info = d.ACNumber+"/"+d.FlightNumber+"/"+
      d.RouteFrom+"/"+d.RouteTo+"/"+
      start_time+"/"+end_time;
    var box_w = x2 - x1;
    if(box_w < box_min){
      box_w = box_min;
    }

    var box_g = draw_box(svg,d.ACNumber+'_'+d.FlightNumber,
      {
        x:x1,
        y:y,
        width:box_w,
        height:box_h,
        from:d.RouteFrom,
        to:d.RouteTo,
        info:info,
    }).datum(d);// data binding
    // box_g.on('mouseover',(d)=>{
    //   var msg = box_g.attr('msg-tooltip');//job descriptions
    //   //console.log(msg);
    //   if((msg!==null) & (msg!=="")){
    //     bubble_show(d3.event.pageX+20,d3.event.pageY-60,show_msg(msg));
    //   }
    // }).on('mouseout',(d)=>{bubble_hide();});
    box_g.on("mouseover",function(){
      d3.select(this).moveToFront();
    });
    box_g.append("g").attr("id",'key_'+d.FlightKey);

    // 정보 출력
    // 1. flight mumber 가운데 출력
    // 2. 출도착지 하단 앞 뒤 출력
    // 3. 시간 출력 상단 앞 뒤 출력
    // 4. 작업자 정보 출력용 표시(빈값으로) - 이후 정보가 있을경우 처리
    // 5. flight msg - 박스 아래
    // 6. 출도착 시간 업데이트 - 기존 시간 아래 붉은색 표시
    // 7. 게이트 표시 - 출도착 공항 옆에 표시
    // text-anchor 속성을 이용하여 위치 조정
    draw_text(box_g,box_w/2,box_h/2+10,d.FlightNumber)
      .attr('text-anchor','middle')
      .attr("id","FlightNumber_"+d.FlightNumber).attr("font-size",box_w>100?"28":"19")
      //mouse click event
      .on('click',show_flt_modal);
      //.on('dblclick',show_flt_modal);
      //.on('click',show_worker);
    draw_text(box_g,2,box_h-5,d.RouteFrom)
      .attr('text-anchor','start')
      .attr("id","RouteFrom").attr("font-size","14")
      .on('mouseover',(d)=>{
        var sel_geneva = filter_geneva(d);
        //console.log(sel_geneva);
        if(sel_geneva!==null){
          var msg = crew_info(sel_geneva[0].Crew);
          //console.log(msg);
          bubble_show(d3.event.pageX+20,d3.event.pageY-60,show_msg(msg.join('<br>')));
        }
      }).on('mouseout',(d)=>{bubble_hide();});
    draw_text(box_g,box_w-2,box_h-5,d.RouteTo)//2+box_w-33
      .attr('text-anchor','end')
      .attr("id","RouteTo").attr("font-size","14");
    draw_text(box_g,2,box_h/4-2,start_time.substr(11))
      .attr('text-anchor','start')
      .attr("id","start_time").attr("font-size","12");
    draw_text(box_g,box_w-2,box_h/4-2,end_time.substr(11))//box_w-31
      .attr('text-anchor','end')
      .attr("id","end_time").attr("font-size","12");
    // 작업자 3명 표시 - 보내는자(D), 받는자(A), 탑승지원(B)
    draw_text(box_g,box_w/2,-10,'',cls='worker_text').attr("id","workerB")//worker
    .attr('text-anchor','middle')
    .attr("font-size","12").attr("font-weight","10")
    // 작업자 코드, sub 작업자 이름과 코드 설정
    .attr('empcd','').attr('sub_empnm','').attr('sub_empcd','')
    .on('mouseover',(d)=>{//mouse over tooltip
      //console.log(d);
      bubble_show(d3.event.pageX + 5,d3.event.pageY - 50,
        show_emp(d3.select('#'+d.ACNumber+'_'+d.FlightNumber).select('#workerB').attr('empcd'),
        d3.select('#'+d.ACNumber+'_'+d.FlightNumber).select('#workerB').attr('sub_empnm'))
      );
    }).on("mouseout", function(d) {
      bubble_hide();
       //d3.select('#tooltip_div').transition().duration(500).style("opacity", 0);
    });
    draw_text(box_g,0,-10,'',cls='worker_text').attr("id","workerD")//worker1
    .attr('text-anchor','middle')
    .attr("font-size","12").attr("font-weight","10")
    // 작업자 코드, sub 작업자 이름과 코드 설정
    .attr('empcd','').attr('sub_empnm','').attr('sub_empcd','')
    .on('mouseover',(d)=>{//mouse over tooltip
      //console.log(d);
      bubble_show(d3.event.pageX + 5,d3.event.pageY - 50,
        show_emp(d3.select('#'+d.ACNumber+'_'+d.FlightNumber).select('#workerD').attr('empcd'),
        d3.select('#'+d.ACNumber+'_'+d.FlightNumber).select('#workerD').attr('sub_empnm'))
      );
    }).on("mouseout", function(d) {
      bubble_hide();
       //d3.select('#tooltip_div').transition().duration(500).style("opacity", 0);
    });
    draw_text(box_g,box_w,-10,'',cls='worker_text').attr("id","workerA")//worker2
    .attr('text-anchor','middle')
    .attr("font-size","12").attr("font-weight","10")
    // 작업자 코드, sub 작업자 이름과 코드 설정
    .attr('empcd','').attr('sub_empnm','').attr('sub_empcd','')
    .on('mouseover',(d)=>{//mouse over tooltip
      //console.log(d);
      bubble_show(d3.event.pageX + 5,d3.event.pageY - 50,
        show_emp(d3.select('#'+d.ACNumber+'_'+d.FlightNumber).select('#workerA').attr('empcd'),
        d3.select('#'+d.ACNumber+'_'+d.FlightNumber).select('#workerA').attr('sub_empnm'))
      );
    }).on("mouseout", function(d) {
      bubble_hide();
       //d3.select('#tooltip_div').transition().duration(500).style("opacity", 0);
    });
    // flight msg 고정용
    draw_text(box_g,box_w/2,box_h+10,'')
      .attr('text-anchor','middle').style('fill','darkred')
      .attr("id","flight_msg").attr('flt_msg','').attr("font-size","14")
      .on('mouseover',(d)=>{
        var msg = box_g.select('#flight_msg').attr('flt_msg');//job descriptions
        //console.log(msg);
        if((msg!==null) & (msg!=="")){
          bubble_show(d3.event.pageX+20,d3.event.pageY-60,show_msg(msg));
        }
      }).on('mouseout',(d)=>{bubble_hide();});
  
    // 실 출도착 시간 처리용
    draw_text(box_g,2,box_h/3+4,'')
      .attr('text-anchor','start')
      .attr("id","sch_start_time").attr("font-size","12")
      .attr("fill","darkred");//.attr("opacity",0.9);
    draw_text(box_g,box_w-2,box_h/3+4,'')//box_w-31
      .attr('text-anchor','end')
      .attr("id","sch_end_time").attr("font-size","12")
      .attr("fill","darkred").attr("opacity",0.9);
    // 게이트 번호 표시
    var gate_g = box_g.append('g').attr('id','flt_'+d.FlightNumber)
    draw_text(gate_g,-1,box_h/4-2,"")
      .attr('text-anchor','end')
      .attr("id","GateFrom")
      .attr('gate_num','')
      .attr('manual_num','')
      .attr("font-size","13");
    draw_text(gate_g,box_w+1,box_h-5,"")
      .attr('text-anchor','start')
      .attr("id","GateTo")
      .attr('gate_num','')
      .attr('manual_num','')
      .attr("font-size","13");
    draw_text(gate_g,box_w+1,box_h+7,"")
    .attr('text-anchor','start')
    .attr("id","GateToTime")
    .attr('gate_num_time','')
    .attr("font-size","12")
    .attr("fill","darkgreen");
    draw_text(gate_g,box_w+27,box_h-5,"")
      .attr('text-anchor','start')
      .attr("id","GateTmp")
      .attr('gate_num','')
      .attr('manual_num','')
      .attr("font-size","13");

  });
  // 현재 시간 표시 라인 그리기
  var now = new Date();
  var hh = now.getHours();
  hh = hh>9?''+hh:'0'+hh;
  var mm = now.getMinutes();
  mm = mm>9?''+mm:'0'+mm;
  var x_point = x_scale(parseTime(sel_date + ' ' + hh + ':'+mm));
  draw_line(svg.append("g"),x_point,x_point,0,parseFloat(svg.attr('height')))
  .style('stroke','red')
  .style('stroke-width','4px')
  .style('stroke-dasharray','5 5')
  .style('opacity',0.5);

  // 배정된 작업자 정보 읽어서 표시
  d3.json('/job_workers/workers/'+sel_date+'/'+sel_station,(err,data)=>{
    data.recordset.recordset.forEach((d)=>{
      //console.log(d);
      var sel_worker = d3.select('#'+d.ACNumber+'_'+d.FlightNumber).select('#worker'+d.OperationType);
      if(d.ResponsibilityType == 'M'){
        sel_worker.attr('empcd',d.EmpCode).text(d.EmpName);
      }else if (d.ResponsibilityType == 'S') {
        sel_worker.attr('sub_empcd',d.EmpCode).attr('sub_empnm',d.EmpName);
      }
    });
  });
  // update schedule,gate num
  show_update_schedule();
  show_gate_num();

  // 입력된 메시지 정보 읽어소 표시
  d3.json('/job_descs/'+sel_date+'/'+sel_station,(err,data)=>{
    data.recordset.recordset.forEach((d)=>{
      //console.log(d);
      var sel_parent = d3.select('#'+d.ACNumber+'_'+d.FlightNumber);
      if(d.OperationType == 'M' && d.Remarks != ''){//main description
        sel_parent.attr('msg-tooltip',d.Remarks);
        sel_parent.select('#flight_msg').attr('flt_msg',d.Remarks).text(msg_mark);
      }else if(d.OperationType == 'C'){//LOV check
        sel_parent.attr('daily_check','true');
        show_lov_check(sel_parent,d.Remarks);
      }else if(d.OperationType == 'GF' && d.Remarks != ''){//Gate From
        sel_parent.select('#GateFrom').attr('manual_num',d.Remarks).text(d.Remarks+'-');
      }else if(d.OperationType == 'GT' && d.Remarks != ''){//Gate To
        //console.log('Gate to : '+d.Remarks+'/')
        sel_parent.select('#GateTo').attr('manual_num',d.Remarks).text('-'+d.Remarks);
      }else if(d.OperationType == 'GG' && d.Remarks != ''){//Gate Tmp
        sel_parent.select('#GateTmp').attr('manual_num',d.Remarks).text('('+d.Remarks+')');
      }
    });
  });

  // deffer info
  show_nrc_info();
}
//show nrc info
var nrc_data = null;
function show_nrc_info(){
  // create nrc info group
  var nrc_g = d3.select('svg').append('g').attr('id','nrc_g')
    .attr("transform", "translate(" + (svg_w - pad_right + 10) + "," + pad_top + ")");

  var json_url = '/nrc_info/';
  d3.json(json_url,(err,data)=>{
    //console.log(data);
    if(err){
      console.log(err);
      //console.log(data);
      alert('Server Internal Error, please email to system administrator!');
    }else{
      //console.log(data);
      if(data.result == 1){
        var nrc_body = "";
        nrc_data = data.data.recordset;
        data.data.recordset.sort((a,b)=>{
          if(a.ACNumber < b.ACNumber){ return -1;
          }else if(a.ACNumber == b.ACNumber && a.DueDate < b.DueDate){ return -1;
          }else if(a.ACNumber == b.ACNumber && a.DueDate == b.DueDate){ return 0;
          }else{ return 1;
          }
        });
        //drew head
        draw_text(nrc_g,5,1,'TASK#')
        .attr('text-anchor','left').style('fill',color).attr("font-size","12");
        draw_text(nrc_g,70,1,'DEF Type')
          .attr('text-anchor','left').style('fill',color).attr("font-size","12");
        draw_text(nrc_g,140,1,'ATA')
        .attr('text-anchor','left').style('fill',color).attr("font-size","12");
        draw_text(nrc_g,180,1,'DUE')
        .attr('text-anchor','left').style('fill',color).attr("font-size","12");

        // draw data
        var color = 'darkred';
        for(k in hl_map){
          var sel_data = nrc_data.filter(e => { return e.ACNumber == k });
          sel_data.forEach((e,i) => {
            if(i < 4){
              var nrc_y = y_scale(hl_map[k])-(svg_h_unit+box_h)*(5-i)/5;
              draw_text(nrc_g,1,nrc_y,e.TaskNumber)
              .attr('text-anchor','left').style('fill',color).attr("font-size","13");
              draw_text(nrc_g,70,nrc_y,e.DeferType+'-'+e.DefCategory+'-'+e.DeferReason)
                .attr('text-anchor','left').style('fill',color).attr("font-size","13");
              draw_text(nrc_g,140,nrc_y,e.ATAChapterCode)
              .attr('text-anchor','left').style('fill',color).attr("font-size","13");
              draw_text(nrc_g,180,nrc_y,e.DueDate)
              .attr('text-anchor','left').style('fill',color).attr("font-size","13");
            }
          });
          //console.log(sel_data);
          color = color == 'darkred'?'darkblue':'darkred';
        }
        // data.data.recordset.forEach((e)=>{
        //   nrc_body += `<tr><td>${e.ACNumber}</td>
        //       <td>${e.TaskNumber}</td><td>${e.DeferType}-${e.DefCategory}-${e.DeferReason}</td>
        //       <td>${e.ATAChapterCode}</td><td>${e.DueDate}</td></tr>`;
        // });
        // nrc_body = `<table class="table table-condense table-striped table-hover">
        //   <tbody><tr><th>A/C#</th><th>T/C#</th><th>Defer</th><th>ATA</th><th>DueDate</th></tr>
        //   ${nrc_body}
        //   </tbody></table>`;
        // if(d3.select('#nrc_info').node() == null){
        //   nrc_body = `<div id="nrc_info" style="opacity: 1; position:fixed;top:130px;left:1520px;font-size:0.8em;overflow:scroll;width:350px;height:500px">
        //     ${nrc_body}
        //   </div>`;
        //   //d3.select('#flight_board').html(d3.select('#flight_board').html()+nrc_body); 
        // }else{
        //   //d3.select('#nrc_info').html(nrc_body); 
        //}
      }

    }
  });
}

// show update schedule
function show_update_schedule(){
  var sel_date = d3.select('#log_date').property('value');
  var sel_station = d3.select('#station').property('value');
  var json_url = '/flight_board/schedule/'+sel_date+'/'+sel_station;
  d3.json(json_url,(err,data)=>{
    //console.log(data);
    if(err){
      console.log(err);
      //console.log(data);
      alert('Server Internal Error, please email to system administrator!');
    }else{
      //update
      if(data.result == 1){
        data.schedule.recordset.forEach((e)=>{
          //console.log('#'+e.ACNumber+'_'+e.FlightNumber,e.RampOut.slice(11,16));
          //console.log('FlightKey : '+e.FlightKey);
          var flight_node = d3.select(d3.select('#key_'+e.FlightKey).node().parentNode);
          // RampOut
          //d3.select('#'+e.ACNumber+'_'+e.FlightNumber)
          flight_node.select('#sch_start_time').text(e.RampOut.slice(11,16));
          //d3.select('#'+e.ACNumber+'_'+e.FlightNumber)
          flight_node.select('#sch_end_time').text(e.RampIn.slice(11,16));
          // 위치 조정
          //console.log(e.RampOut,rtime_to_postion(e.RampOut));
          //console.log(e.ACNumber,acnumber_to_postion(e.ACNumber))
          //d3.select('#'+e.ACNumber+'_'+e.FlightNumber)
          flight_node.transition()
            .attr("transform","translate("+rtime_to_postion(e.RampOut)+","+(acnumber_to_postion(e.ACNumber)-box_h)+")");
        });
      }
    }
  });
}
// show gate num
function show_gate_num(){
  var sel_date = d3.select('#log_date').property('value');
  var sel_station = d3.select('#station').property('value');
  var csv_url = '/data/'+sel_station+'_'+sel_date+'.csv';
  console.log(csv_url)
  d3.csv(csv_url,(err,data)=>{
    data.forEach((d)=>{
      //해당 객체 찾기 - 출발 GateFrom_flt#, 도착 GateTo_flt#
      //게이트 번호 붙이기
      //console.log(d);
      if(d.flt != ""){
        var gate_g = d3.select('#flt_'+d.flt);
        if(d.type == 'D'){
          gate_g.select('#GateFrom').attr('gate_num',d.gate).text(d.gate+'-');
        }else{
          gate_g.select('#GateTo').attr('gate_num',d.gate).text('-'+d.gate);
          // Arrival && ICN && 도착하지 않은 경우(sch_end_time == '') 예정 시간 표시(파란색)
          if(sel_station === 'ICN'){
            gate_g.select('#GateToTime').attr('gate_num_time',d.to).text('('+d.to+')');
          }
        }
      }
    });
  });
}

function set_gate_num(gate_g,gate_id,tp){
  console.log('set_gate_num');
  //tp GF(FROM) GT(TO) GG(TMP)
  var gate_num = gate_g.select(gate_id).attr('manual_num');
  console.log('1'+gate_num);
  gate_num = gate_num != ''?gate_num:gate_g.select(gate_id).attr('gate_num');
  if(gate_num == ''){
    gate_num = '';
  }else if(tp == 'GF'){
    gate_num = gate_num + '-';
  }else if(tp == 'GT'){
    gate_num = '-' + gate_num;
  }else{
    gate_num = '(' + gate_num + ')';
  }
  console.log('2'+gate_num);
  gate_g.select(gate_id).text(gate_num);
}

// show worker detail information
function show_emp(id,sub_nm=""){
  //console.log(id);
    return function(){
      d3.json('/job_workers/info/'+id,(err,data)=>{
        var html = 'Name : '+data.data.recordset[0].EmpName +
                  '<br/>Email: ' + data.data.recordset[0].eMail +
                  '<br/>Tel : '+ data.data.recordset[0].MobileNo +
                  '<br/>Sub : '+ sub_nm;
        d3.select('#tooltip_div').html(html);
        //console.log(data.data.recordset);
      });
      //return "Name:<br/>Tel:<br/>Email:"
    }

}
// show lov check
function show_lov_check(parent,lov_msg){
  console.log(lov_msg);
  parent.select('#daily_check').remove();
  if(lov_msg !== ''){
    d3.text('/images/flight3.svg',(d)=>{
      var x = parent.select('rect').attr('width')-30;
      var y = -25
      var daily_check = parent.append('g')
      .attr('id','daily_check')
      .attr('transform',`translate(${x},${y})`);
      daily_check.append('path').attr('d',d)
        .attr('transform',`translate(28,5) scale(0.7) rotate(1)`)
        .attr('opacity','0.5');
      draw_text(daily_check,32,60,lov_msg)
      .attr('text-anchor','start')
      .attr("id","check_txt").attr("lov",lov_msg)
      .attr("font-size","14").attr("fill","darkred");
    });
  }
}

// save workers
function save_workers(parent){
  console.log(parent.data());
  let p_data = parent.data()[0];
  let save_data = {
    FlightPlanID:p_data.FlightPlanID,
    ACNumber:p_data.ACNumber,
    WorkerList:[]
  };
  save_data.WorkerList.push([parent.select('#workerA').attr('empcd'),'A','M']);
  save_data.WorkerList.push([parent.select('#workerA').attr('sub_empcd'),'A','S']);
  save_data.WorkerList.push([parent.select('#workerB').attr('empcd'),'B','M']);
  save_data.WorkerList.push([parent.select('#workerB').attr('sub_empcd'),'B','S']);
  save_data.WorkerList.push([parent.select('#workerD').attr('empcd'),'D','M']);
  save_data.WorkerList.push([parent.select('#workerD').attr('sub_empcd'),'D','S']);
  console.log(save_data);
  d3.json('/job_workers/save',function(error, data) {
       //console.log(data);
       //처리 결과를 화면에 재정리
       parent.selectAll('.worker_text').style('fill','black');
    })
   .header("Content-Type","application/json")
   .send("POST", JSON.stringify(save_data));
}
// save descriptions
function save_descs(parent,msg){
  console.log(parent.data());
  let p_data = parent.data()[0];
  let save_data = {
    FlightPlanID:p_data.FlightPlanID,
    ACNumber:p_data.ACNumber,
    OperationType:'M',
    Remarks:msg,
    Used:'Y'
  };
  console.log(save_data);
  d3.json('/job_descs/save',function(error, data) {
       //console.log(data);
    })
   .header("Content-Type","application/json")
   .send("POST", JSON.stringify(save_data));
}
// save daily check
function save_lov_check(parent,lov){
  console.log('save_lov_check');
  console.log(lov);
  if(lov != null){
    //var lov = parent.select('#daily_check').select('#check_txt').attr('lov');
    let p_data = parent.data()[0];
    let save_data = {
      FlightPlanID:p_data.FlightPlanID,
      ACNumber:p_data.ACNumber,
      OperationType:'C',//daily check type
      Remarks: lov,//check_lov.value(lov),// LOV MSG
      Used:lov === ''?'N':'Y'
    };
    console.log(parent.data());
    console.log(save_data);
    d3.json('/job_descs/daily_check',function(error, data) {
      //console.log(data);
      //처리 결과를 화면에 재정리
   })
  .header("Content-Type","application/json")
  .send("POST", JSON.stringify(save_data));
 }
}
// save gate tmp
function save_gate_manual(parent,gate_num,tp){
  console.log('save_gate_tmp');
  console.log(gate_num);
  if(tp=='GT'){
    parent.select('#GateTo').attr('manual_num',gate_num);
  }else if(tp == 'GF'){
    parent.select('#GateFrom').attr('manual_num',gate_num);
  }else{
    parent.select('#GateTmp').attr('manual_num',gate_num);
  }
  if(gate_num != null){// && gate_num != ''){
    let p_data = parent.data()[0];
    let save_data = {
      FlightPlanID:p_data.FlightPlanID,
      ACNumber:p_data.ACNumber,
      OperationType:tp,// GF-gate from, GT-gate to, GG-gate tmp
      Remarks: gate_num,
      Used:'Y'
    };
    //console.log(parent.data());
    //console.log(save_data);
    d3.json('/job_descs/daily_check',function(error, data) {
      //console.log(data);
      //처리 결과를 화면에 재정리
   })
  .header("Content-Type","application/json")
  .send("POST", JSON.stringify(save_data));
 }
}

//var modal = $('#flt_modal');
var selected_box = null;
var recordset = null;
function show_flt_modal(d){
  //console.log(d);
  // flight information
  $('#flt_modal #FlightNumber').text(`${d.ACNumber}-${d.FlightNumber}`);
  $('#flt_modal #Route').text(`${d.RouteFrom}->${d.RouteTo}`);
  $('#flt_modal #StardardTime').text(`${rtime_to_time(d.StandardTimeArrival)} ~ ${rtime_to_time(d.StandardTimeDeparture)}`);
  
  selected_box = d3.select('#'+d.ACNumber+'_'+d.FlightNumber);
  // setup dept
  d3.json('/depts',(err,data)=>{
    //console.log(data.data.recordset);
    recordset = data.data.recordset;
    var dept_codes = filter_depts(recordset);
    //Departure Worker 
    var dept_select = d3.select('#flt_modal').select('#key_deptDM');
    set_select(dept_select,dept_codes);
    var empcd = selected_box.select('#workerD').attr('empcd');
    var deptcd = emp_to_dept(recordset,empcd);
    $('#flt_modal #key_deptDM').val(deptcd);
    var emp_codes = filter_emps(recordset,deptcd)
    var emp_select = d3.select('#flt_modal').select('#sel_deptDM');
    set_select(emp_select,emp_codes);
    $('#flt_modal #sel_deptDM').val(empcd);
    //sub는 main과 같은 반으로 움직인다고 가정하고 처리 => 별도 처리 변경(2018-03-15)
    dept_select = d3.select('#flt_modal').select('#key_deptDS');
    set_select(dept_select,dept_codes);
    empcd = selected_box.select('#workerD').attr('sub_empcd');
    deptcd = emp_to_dept(recordset,empcd);
    console.log('sub dept : ' + deptcd);
    $('#flt_modal #key_deptDS').val(deptcd);
    emp_codes = filter_emps(recordset,deptcd)
    emp_select = d3.select('#flt_modal').select('#sel_deptDS');
    set_select(emp_select,emp_codes);
    $('#flt_modal #sel_deptDS').val(empcd);

    //Arrival Worker
    dept_select = d3.select('#flt_modal').select('#key_deptAM');
    set_select(dept_select,dept_codes);
    empcd = selected_box.select('#workerA').attr('empcd');
    deptcd = emp_to_dept(recordset,empcd);
    $('#flt_modal #key_deptAM').val(deptcd);
    emp_codes = filter_emps(recordset,deptcd)
    emp_select = d3.select('#flt_modal').select('#sel_deptAM');
    set_select(emp_select,emp_codes);
    $('#flt_modal #sel_deptAM').val(empcd);
    //sub는 main과 같은 반으로 움직인다고 가정하고 처리 => 별도 처리 변경(2018-03-15)
    dept_select = d3.select('#flt_modal').select('#key_deptAS');
    set_select(dept_select,dept_codes);
    empcd = selected_box.select('#workerA').attr('sub_empcd');
    deptcd = emp_to_dept(recordset,empcd);
    console.log('sub dept : ' + deptcd);
    $('#flt_modal #key_deptAS').val(deptcd);
    emp_codes = filter_emps(recordset,deptcd)
    emp_select = d3.select('#flt_modal').select('#sel_deptAS');
    set_select(emp_select,emp_codes);
    $('#flt_modal #sel_deptAS').val(empcd);

    //Boarding
    dept_select = d3.select('#flt_modal').select('#key_deptBM');
    set_select(dept_select,dept_codes);
    empcd = selected_box.select('#workerB').attr('empcd');
    deptcd = emp_to_dept(recordset,empcd);
    $('#flt_modal #key_deptBM').val(deptcd);
    emp_codes = filter_emps(recordset,deptcd)
    emp_select = d3.select('#flt_modal').select('#sel_deptBM');
    set_select(emp_select,emp_codes);
    $('#flt_modal #sel_deptBM').val(empcd);
    //sub는 main과 같은 반으로 움직인다고 가정하고 처리 => 별도 처리 변경(2018-03-15)
    dept_select = d3.select('#flt_modal').select('#key_deptBS');
    set_select(dept_select,dept_codes);
    empcd = selected_box.select('#workerB').attr('sub_empcd');
    deptcd = emp_to_dept(recordset,empcd);
    console.log('sub dept : ' + deptcd);
    $('#flt_modal #key_deptBS').val(deptcd);
    emp_codes = filter_emps(recordset,deptcd)
    emp_select = d3.select('#flt_modal').select('#sel_deptBS');
    set_select(emp_select,emp_codes);
    $('#flt_modal #sel_deptBS').val(empcd);

    //LOV 코드
    set_select(d3.select('#flt_modal').select('#main_chk'),check_lov.table().concat([[99,'']]));
    var lov_msg = selected_box.select('#daily_check').select('#check_txt');
    lov_msg = lov_msg.empty()?'':lov_msg.attr('lov');
    //console.log(lov_msg);
    $('#flt_modal #main_chk').val(check_lov.code(lov_msg));

    //comment
    $('#flt_modal #flt_msg').val(selected_box.select('#flight_msg').attr('flt_msg'));
    //gate
    $('#flt_modal #gate_from').val(selected_box.select('#GateFrom').attr('gate_num'));
    $('#flt_modal #gate_to').val(selected_box.select('#GateTo').attr('gate_num'));
    $('#flt_modal #mgate_from').val(selected_box.select('#GateFrom').attr('manual_num'));
    $('#flt_modal #mgate_to').val(selected_box.select('#GateTo').attr('manual_num'));
    $('#flt_modal #mgate_tmp').val(selected_box.select('#GateTmp').attr('manual_num'));

    //show
    $('#flt_modal').modal('show');
  });  
}

// {부서코드:부서명} 객체 생성 배열 생성
function filter_depts(recordset){
  var dept_codes = new Set();
  var dept_map = {};
  recordset.forEach(e => {
    dept_codes.add(e.DeptCode);
    dept_map[e.DeptCode] = e.DeptName;
  });
  return Array.from(dept_codes).sort().map(e=>{return [e,dept_map[e]]})
}
// 선택한 객체의 사용자 정보를 이용하여 부서 코드 정보 가져 오기
// 부서코드가 없을 경우 현재 station 코드를 이용하여 기본 정보 처리
function emp_to_dept(recordset, empcd){
  //console.log(recordset);
  var dept = recordset.find(e=>{return e.EmpCode == empcd});
  var default_dept = {
    GMP:"5100",    ICN:"6100",
    CJU:"3300",    CJJ:"3200",
    PUS:"3400",    KUV:"3300",
    ALL:"3000"
  }
  return dept?dept.DeptCode:default_dept[$('#station').val()];
}
//부서코드를 이용 해당 작업자 리스트 생성
function filter_emps(recordset,dept){
  if(dept != undefined){
    var dept_codes = recordset.filter(e=>{return e.DeptCode == dept})
    .map(e=>{return [e.EmpName,e.EmpCode]}).sort();
    dept_codes.push(['','']);
    return dept_codes.map(e=>{ return e.reverse()});
  }else{
    // default list of current station
    return ['',''];
  }
}
// [코드,값] 형태의 배열을 이용 select에 option 값 설정
function set_select(select,code_table){
  select.selectAll('option').remove();
  code_table.forEach(e =>{
    select.append('option')
      .attr('value',e[0]).text(e[1]);
  })
}
