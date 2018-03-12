import requests
from bs4 import BeautifulSoup as bs
import pandas as pd
from datetime import datetime

head = {
   'User-Agent':'Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/63.0.3239.84 Safari/537.36'
}

def select_gmp_list(url,params,table_class='table-responsive'):
    res = requests.post(url,headers=head,params=params)
    soup = bs(res.text,'lxml')
    tr_list = soup.select('.'+table_class+' tr')
    td_list = [list(map(lambda x:x.text.strip(),td)) for td in [tr.select('td')[1:] for tr in tr_list[1:]]]
    return td_list
def select_icn_list(url,params,tp):
    res = requests.post(url,headers=head,params=params)
    soup = bs(res.text,'lxml')
    td_list = []
    for tr in soup.select('div.flight-info-basic')[1:]:
        td_line = [tp]#type
        #print(tr.select('.flight-info-basic-flight-number')[0].text.strip())
        # flight number
        td_line.append(tr.select('.flight-info-basic-flight-number')[0].text.strip()[2:])
        # arrival,departure time
        if(tp == 'D'):## Depature
            td_line.append(tr.select('.time-changed')[0].text.strip())
            td_line.append('-')
            td_line.append(tr.select('.center')[2].text.strip())#tm
            td_line.append(tr.select('.center')[4].text.strip())#gate
            td_line.append(tr.select('.center')[3].text.strip())#count
            td_line.append(tr.select('.center')[5].text.strip())#status
        else:## Arrival
            td_line.append('-')
            td_line.append(tr.select('.time-changed')[0].text.strip())
            td_line.append(tr.select('.center')[2].text.strip())#tm
            td_line.append(tr.select('.center')[3].text.strip())#gate
            td_line.append(tr.select('.center')[4].text.strip())#baggage
            td_line.append(tr.select('.center')[6].text.strip())#status
        
        ## because time is just one for departure or arrival, add - for column length
        td_list.append(td_line)
    return td_list

def kac_sch_list(port='GMP',dir_name='public/data/'):
    ## 한국공항공사 데이터
    params = {
        'airPort':port,
        'stHour':'01',
        'stMinute':'00',
        'edHour':'24',
        'edMinute':'55',
        'airType':'',
        'airLine':'ZE',
        'airLineNum':''
    }
    kac_list = []
    ## 한국공항공사 출발
    url = 'https://www.airport.co.kr/gimpo/extra/liveSchedule/liveScheduleList/layOut.do?langType=1&inoutType=OUT&cid=2015102611043202364&menuId=8'
    kac_list.extend([['D',d[0][2:],d[1],d[2],d[5],d[6]] for d in select_gmp_list(url,params,'table-responsive')])
    ## 한국공항공사 도착
    url = 'https://www.airport.co.kr/gimpo/extra/liveSchedule/liveScheduleList/layOut.do?langType=1&inoutType=IN&cid=2015102611052578964&menuId=10'
    kac_list.extend([['A',d[0][2:],d[1],d[2],d[5],d[6]] for d in select_gmp_list(url,params,'table-responsive')])
    df = pd.DataFrame(kac_list,columns=['type','flt','from','to','tm','gate'])
    df.to_csv(dir_name+port+'_'+datetime.today().strftime('%Y-%m-%d')+'.csv')
    return df

def icn_sch_list(dir_name='public/data/'):
    today = datetime.today().strftime('%Y%m%d')
    ## 인천공항공사 데이터
    params = {
        'A':'A',
        'FROM_TIME':today+'0000',
        'TO_TIME':today+'2400',
        'AIRLINE':'ZE'
    }
    icn_list = []
    ## 인천공항공사 출발
    url = 'https://www.airport.kr/ap/ko/dep/depPasSchList.do'
    icn_list.extend([d[0:6]
                     for d in select_icn_list(url,params,'D')])
    ## 인천공항공사 도착
    url = 'https://www.airport.kr/ap/ko/arr/arrPasSchList.do'
    icn_list.extend([d[0:6]
                     for d in select_icn_list(url,params,'A')])
    df = pd.DataFrame(icn_list,columns=['type','flt','from','to','tm','gate'])
    df.to_csv(dir_name+'ICN_'+datetime.today().strftime('%Y-%m-%d')+'.csv')
    return df