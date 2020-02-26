import React from 'react';
import axios from 'axios';
import styling from './styling.css';
import Firebase from 'firebase';
import config from './config';
import { Cookies } from 'react-cookie';




let stops = [
  ['Byparken', 30859],
  ['Nonneseter', 30862],
  ['Nygård', 58545],
  ['Florida', 58544],
  ['Danmarksplass', 31372],
  ['Kronstad', 31374],
  ['Brann stadion', 31377],
  ['Wergeland', 31379],
  ['Sletten senter', 31382],
  ['Slettebakken', 31384],
  ['Fantoft', 31388],
  ['Paradis', 58543],
  ['Hop', 29815],
  ['Nesttun terminal', 58542],
  ['Nesttun sentrum', 58541],
  ['Skjoldskiftet', 59851],
  ['Mårdalen', 58540],
  ['Skjold', 29830],
  ['Lagunen', 59849],
  ['Råstølen', 58539],
  ['Sandslivegen', 58538],
  ['Sandslimarka', 30148],
  ['Kokstad', 30154],
  ['Birkelandskiftet', 58537],
  ['Kokstadflaten', 30159],
  ['Bergen lufthavn', 58536]
];


class Skyss extends React.Component {

  constructor(props) {
    super(props);

    this.state = {
      schedule: [],
      loaded: false,
      byparken: [],
      flesland: [],
      time: null,
      interval: null,
      currentstop: null,
      displaytype: 1,
      stops: null,
      showsettings: true
    }
    this.setDisplay = this.setDisplay.bind(this);
    this.setPrefered = this.setPrefered.bind(this);
    this.changeLayout = this.changeLayout.bind(this);

  }

   componentDidMount() {
    setInterval(() => {
      this.setState({
        time: new Date().toLocaleString().split(',')[1]
      })
    }, 1000)

 
    const cookies = new Cookies(); 
    let temp = cookies.get('preferedStop');

    if(temp === 'null' || temp === undefined){
      cookies.set('preferedStop','Byparken', {path: '/', expires: new Date(Date.now()+604800000)});
    }
    
     this.pickStop(cookies.get('preferedStop'));

  }

  pickStop(value) {

    clearInterval(this.state.interval);

    let selectstop = null;
    let stopname = null;

      stops.forEach(element => {
      if (element[0] === value) {

        selectstop = this.setQuery(element[1]);
        stopname = element[0];
      }
    });

    let options = {
      headers: {
        'Content-Type': 'application/json',
        'ET-Client-Name': 'jakob-rutetabell for bybane'
      }
    }

    this.performQuery(selectstop, options);

    let intervall = setInterval(() => {
      this.performQuery(selectstop, options);
    }, 60000)

    this.setState({
      interval: intervall,
      currentstop: stopname
    });

  }

  performQuery(selectstop, options) {
    axios.post('https://api.entur.io/journey-planner/v2/graphql', selectstop, options)
      .then((response) => {
        this.setState({
          schedule: response.data,
          loaded: true
        });
        this.filterSchedules();
      }).catch(error => {
        console.log("Klarte ikke hente info, prøv igjen senere ", error.response)
      });;
  }

  setQuery(stopCode) {

    let body = {
      query: `
                query {
                    stopPlace(id:"NSR:StopPlace:${stopCode}") {
                        id
                        name
                        estimatedCalls(timeRange: 72100, numberOfDepartures: 20){
                          aimedArrivalTime
                          destinationDisplay{
                            frontText
                          }
                          serviceJourney{
                            journeyPattern{
                              line{
                                name
                              }
                            }
                          }
                        }
                    }
                }
            `,
      variables: {}
    }
    return body;
  }

  parseTime(departure) {

    let departureTime = new Date();
    let currentTime = new Date();
    let departureSubstring = departure.substring(departure.lastIndexOf("T") + 1, departure.lastIndexOf(":"));

    if (this.state.displaytype === 1) {

      return departureSubstring;

    } else if (this.state.displaytype === 0) {

      departureTime.setHours(departureSubstring.split(':')[0]);
      departureTime.setMinutes(departureSubstring.split(':')[1]);
      let time = (((departureTime - currentTime) / 1000) / 60);
      return (time >= 0 && time % 1 === 0 ? time + " min" : null);

    }
  }

  filterSchedules() {
    let byparkenTemp = [];
    let fleslandTemp = [];

    this.state.schedule.data.stopPlace.estimatedCalls.forEach(element => {

      if (element.destinationDisplay.frontText === "Byparken" && this.state.currentstop !== "Byparken") {
        let departure = this.parseTime(element.aimedArrivalTime);
        if(departure != null){
          byparkenTemp.push(departure);
        }
        
      }

      if (element.destinationDisplay.frontText === "Bergen lufthavn" && this.state.currentstop !== 'Bergen lufthavn') {
        let departure = this.parseTime(element.aimedArrivalTime);
         if(departure != null){
          fleslandTemp.push(departure);
         }
        
      }

    });

    this.setState({
      byparken: byparkenTemp,
      flesland: fleslandTemp
    });
  }

  setDisplay(type) {

    //drittkode men fungerer
    let val;
    if (this.state.displaytype === 1) {
      val = 0;
    } else if (this.state.displaytype === 0) {
      val = 1;
    }
    this.setState({
      displaytype: val
    }, () => { this.filterSchedules() });
  }

  setPrefered(name){
    
    let cookies = new Cookies();
    let tempCookie = cookies.get('preferedStop');

    if(tempCookie !== undefined){
      cookies.remove('preferedStop');
      cookies.set('preferedStop',name, {path: '/', expires: new Date(Date.now()+604800000)})     
    }
  }

  changeLayout(showsettings){

    let tempsettings; 

    if(showsettings){
      tempsettings = false; 
    }else if(!showsettings){
      tempsettings = true; 
    }
  
    this.setState({
      showsettings: tempsettings
    });

  }

  render() {
    return (
      <div>
        {this.state.currentstop != null ?
          <div>
            <h1>Skyss Rutetabell</h1>
            <button className ="button button6" onClick={() => {this.changeLayout(this.state.showsettings)}}>{this.state.showsettings ? "Skjul" : "Innstillinger"} </button>
            <div className={this.state.showsettings ? "showsettings" : "hidesettings"}>
            <div> Velg stopp:
             <select className="dropdown" onChange={(e) => this.pickStop(e.target.value)} value={this.state.currentstop === null ? 'byparken' : this.state.currentstop}>
                {stops.map(function (rute, idx) {
                  return (<option key={idx}>{rute[0]}</option>)
                })}
              </select>  
            </div>              
            <div className="button-time">
              <button className="button button4" onClick={this.setDisplay}>{this.state.displaytype === 1 ? "Minutter" : "Klokkeslett"} </button>
              <button className="button button5" onClick={() => {this.setPrefered(this.state.currentstop)}}>Sett som favoritt</button>      
            </div>
            </div>
            <div className={this.state.showsettings ? "" : "bottom"}>
            <div className={this.state.showsettings ? "hidestop" : "showstop"}>
            <p className="stop">{this.state.currentstop}</p>
            </div>
            <div className="time">
              {this.state.time}
            </div>
            <div className="right">
              <h3>Mot Flesland</h3>
              <ul>
                {!this.state.loaded ? "Henter Ruter" : this.state.flesland.map(function (rute, idx) {
                  return (<li key={idx}>{rute}</li>)
                })}
              </ul>
            </div>
            <div className="left">
              <h3>Mot Byparken</h3>
              <ul>
                {!this.state.loaded ? "Henter Ruter" : this.state.byparken.map(function (rute, idx) {
                  return (<li key={idx}>{rute}</li>)
                })}
              </ul>
            </div></div></div> : 
            <div>
              <h2>Henter data...</h2>
            </div>}


      </div>

    );
  }
}

export default Skyss