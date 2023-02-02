import { environment } from '../../environments/environment.prod';
import { DataService } from '../data.service';
import { Component, AfterViewInit, Output, EventEmitter } from '@angular/core';
import { Feature, Map, View } from 'ol';
import { Image as ImageLayer, Tile as TileLayer, Vector } from 'ol/layer';
import { transform } from 'ol/proj';
import XYZ from 'ol/source/XYZ';
import OSM from 'ol/source/OSM';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import GeoJSON from 'ol/format/GeoJSON';
import { Fill, Stroke, Circle, Style } from 'ol/style';
import { scaleSequential } from 'd3-scale';
import { interpolateBlues } from 'd3-scale-chromatic';
import {
  Draw,
  Select,
  Translate,
  defaults as defaultInteractions,
} from 'ol/interaction';
import GeometryType from 'ol/geom/GeometryType';
import { shiftKeyOnly, click } from 'ol/events/condition';
import Polygon from 'ol/geom/Polygon';
import { ChartComponent } from '../chart/chart.component';
//import { copyFileSync } from 'fs';

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.css'],
})
export class MapComponent implements AfterViewInit {
  map: any;
  coordinates: any;
  mousePosition: number[] = [0, 0];
  values: any = { Winter: 0, Summer: 0, 'Fall/Spring': 0 };
  public chartObject: ChartComponent;
  @Output() onValues = new EventEmitter<string>();

  constructor(private dataService: DataService) {
    this.chartObject = new ChartComponent();
  }

  ngAfterViewInit(): void {
    var colorVal = scaleSequential(interpolateBlues).domain([-700, 700]);
    const source = new VectorSource({
      url: environment.filesurl + 'network',
      format: new GeoJSON(),
    });
    const vectorLayer = new VectorLayer({
      source: source,
      style: function (feature) {
        const val = feature.getProperties();
        const color = colorVal(
          (val['chi-dec-21'] + val['chi-jun-21'] + val['chi-sep-22']) / 3
        );
        const style = new Style({
          fill: new Fill({
            color: color,
          }),
          stroke: new Stroke({
            color: color,
            width: 2,
          }),
        });
        return style;
      },
    });
    const tileLayer = new TileLayer({
      source: new OSM({
        url: 'https://s.basemaps.cartocdn.com/rastertiles/light_all/{z}/{x}/{y}.png',
      }),
    });
    const drawingSource = new VectorSource({ wrapX: false });
    let draw = new Draw({
      source: drawingSource,
      type: GeometryType.POLYGON,
    });
    var select = new Select();
    var selectedFeatures = select.getFeatures();
    const translate = new Translate({
      features: select.getFeatures(),
    });
    const map = new Map({
      layers: [tileLayer, vectorLayer],
      target: 'map',
      view: new View({
        maxZoom: 15,
        center: transform([-87.6298, 41.8781], 'EPSG:4326', 'EPSG:3857'),
        zoom: 15,
      }),
    });
    var drawingLayer = new Vector({
      source: drawingSource,
    });
    map.addLayer(drawingLayer);
    map.addInteraction(draw);
    map.addInteraction(select);
    draw.on('drawstart', function (event) {
      selectedFeatures.clear();
      select.setActive(true);
    });

    draw.on('drawend', function (event) {
      map.removeInteraction(draw);
      map.addInteraction(select);
      map.addInteraction(translate);
      selectedFeatures.clear();
      delaySelectActivate();
      var polygon = event.feature.getGeometry();
      var features = vectorLayer.getSource().getFeatures();
      for (var i = 0; i < features.length; i++) {
        var activeFeature = features[i].getGeometry()?.getExtent();
        if (
          polygon &&
          activeFeature &&
          polygon.intersectsExtent(activeFeature)
        ) {
          selectedFeatures.push(features[i]);
        }
      }
      getDistribution();
    });

    translate.on('translateend', function (event) {
      selectedFeatures.clear();
      let polygon: any = drawingLayer
        .getSource()
        .getFeatures()[0]
        .getGeometry();
      let features: any = vectorLayer.getSource().getFeatures();
      for (var i = 0; i < features.length; i++) {
        if (polygon.intersectsExtent(features[i].getGeometry().getExtent())) {
          selectedFeatures.push(features[i]);
        }
      }
      getDistribution();
    });
    function delaySelectActivate() {
      setTimeout(function () {
        select.setActive(true);
      }, 300);
    }
    const getDistribution = () => {
      let arr = selectedFeatures.getArray();
      let summer: any = [];
      let winter: any = [];
      let fall: any = [];
      arr.forEach((element: Feature) => {
        var props = element.getProperties();
        summer.push(props['chi-jun-21']);
        winter.push(props['chi-dec-21']);
        fall.push(props['chi-sep-22']);
      });
      this.dataService
        .getDistribution([summer, winter, fall])
        .subscribe((data: any) => {
          this.updateValues(data);
        });
    };
  }

  async updateValues(result: any) {
    this.chartObject.updateValues(result);
  }
}
