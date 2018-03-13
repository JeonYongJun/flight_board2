#!/usr/bin/python

import os
import sys
import getopt
import logging
import logging.handlers
import requests
from bs4 import BeautifulSoup as bs
import pandas as pd
from datetime import datetime, timezone, timedelta
import time

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
    for tr in soup.select('div.flight-info-basic-link')[1:]:
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

 # server utc time 사용 => 로컬 time
def utc_to_localtime(frm='%Y%m%d'):
    # datetime.today().strftime('%Y%m%d')
    return datetime.fromtimestamp(time.time(),timezone(timedelta(hours=9))).strftime(frm)


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
    df.to_csv(os.path.join(dir_name,port+'_'+utc_to_localtime('%Y-%m-%d')+'.csv'))
    return df


def icn_sch_list(dir_name='public/data/'):
    today = utc_to_localtime()
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
    df.to_csv(os.path.join(dir_name,'ICN_'+utc_to_localtime('%Y-%m-%d')+'.csv'))
    return df

STATION_CODE = ['ICN','GMP','CJU','CJJ','PUS','KUV']
def help():
    print('[usage]')
    print('ReadAirlineInformation.py [options]')
    print('help option : -h[--help] ')
    print('options : -s <station> -o <out_dir> -l <log_dir>')
    print('station : {}'.format(','.join(STATION_CODE)))

def parse_options(args):
    verbos = '0'
    station = None
    out_dir = None
    log_dir = None
    if(len(sys.argv) < 2):
        help()
        sys.exit(2)

    try:
        opts, args = getopt.getopt(sys.argv[1:],"hs:o:v:l:",["help"])
    except getopt.GetoptError:
        help()
        sys.exit(2)
    for opt, arg in opts:
        if opt == '-h' or opt == '--help':
            help()
            sys.exit()
        elif opt == '-v':
            verbos = arg
        elif opt == '-o':
            out_dir = arg
        elif opt == '-l':
            log_dir = arg
        elif opt == '-s':
            station = arg.upper()
    
    if(not(station and out_dir and log_dir)):
        help()
        sys.exit()
    
    station = station.upper()
    out_dir = os.path.dirname(out_dir)
    log_dir = os.path.dirname(log_dir)
    if(station not in STATION_CODE):
        help()
        sys.exit()

    return (station,out_dir,log_dir,verbos)

if __name__ == "__main__":
    station,out_dir,log_dir,verbos = parse_options(sys.argv)
    #print(station,out_dir,log_dir,verbos)
    # lobber
    logger = logging.getLogger('mylogger')
    # fomatter
    fomatter = logging.Formatter('[%(levelname)s|%(filename)s:%(lineno)s] %(asctime)s > %(message)s')
    filename = os.path.join(log_dir,'python.log')
    # loger level
    if(verbos == '0'):
        loggerLevel = logging.DEBUG
    else:
        loggerLevel = logging.INFO
    logger.setLevel(loggerLevel)
    # handler
    fileMaxByte = 1024 * 1024 * 50 #50, split file
    fileHandler = logging.handlers.RotatingFileHandler(filename, maxBytes=fileMaxByte, backupCount=10)
    # fileHandler = logging.FileHandler(filename)
    streamHandler = logging.StreamHandler()
    # bind formatter
    fileHandler.setFormatter(fomatter)
    streamHandler.setFormatter(fomatter)
    # bind handler
    logger.addHandler(fileHandler)
    logger.addHandler(streamHandler)

    ## crawling job(main job)
    logger.debug('start program')
    try:
        if(station == 'ICN'):
            logger.info('start reading {} information'.format(station))
            icn_sch_list(dir_name=out_dir)
            logger.info('end reading {} information'.format(station))
        else:
            logger.info('start reading {} information'.format(station))
            kac_sch_list(station,dir_name=out_dir)            
            logger.info('end reading {} information'.format(station))
    except Exception as e:
        logger.error('Exception occured!')
        logger.critical(e)
    logger.debug('end program')
    # lobber
    # logger = logging.getLogger('mylogger')
    # fomatter
    # fomatter = logging.Formatter('[%(levelname)s|%(filename)s:%(lineno)s] %(asctime)s > %(message)s')
    # enviroment
    
    # if(station == 'ICN'):
    #    print('')
    #    icn_sch_list()
    # else: kac_sch_list(station)