import { Component, AfterViewInit, Input } from '@angular/core';
import * as d3 from 'd3';

@Component({
  selector: 'app-chart',
  templateUrl: './chart.component.html',
  styleUrls: ['./chart.component.css'],
})
export class ChartComponent implements AfterViewInit {
  boxPlot: any;
  @Input() values: any;
  private svg: any;
  private width!: number;
  private height!: number;
  private margin: any;

  constructor() {}

  private setup(): void {
    this.margin = { top: 30, right: 30, bottom: 40, left: 50 };
    this.width = 300 - this.margin.left - this.margin.right;
    this.height = 400 - this.margin.top - this.margin.bottom;
  }

  private createSvg(): void {
    this.svg = d3
      .select('#chart')
      .append('svg')
      .attr('width', this.width + this.margin.left + this.margin.right)
      .attr('height', this.height + this.margin.top + this.margin.bottom)
      .append('g')
      .attr(
        'transform',
        'translate(' + this.margin.left + ',' + this.margin.top + ')'
      );
  }

  ngAfterViewInit(): void {
    this.setup();
    this.updateValues(this.values);
  }

  buildChart() {
    var data = this.values.res;
    var svg = this.svg;
    var height = this.height;
    var color = ['#debf10', '#b4f222', '#9d0ac9'];
    if (data != null)
      data.forEach(function (data: any, pos: number) {
        var q1: any = data['q1'];
        var median: any = data['median'];
        var q3: any = data['q3'];
        var interQuartileRange = data['q3'] - data['q1'];
        var min = data['min'];
        var max = data['max'];
        var y = d3.scaleLinear().domain([0, 720]).range([height, 0]);
        svg.call(d3.axisLeft(y));
        var center = pos * 40 + 40;
        var width = 50;
        svg
          .append('line')
          .attr('x1', center)
          .attr('x2', center)
          .attr('y1', y(min))
          .attr('y2', y(max))
          .attr('stroke', 'black');
        svg
          .append('rect')
          .attr('x', center - width / 2)
          .attr('y', y(q3))
          .attr('height', interQuartileRange)
          .attr('width', width)
          .attr('stroke', 'black')
          .style('fill', color[pos]);

        svg
          .selectAll('foo')
          .data([min, median, max])
          .enter()
          .append('line')
          .attr('x1', center - width / 2)
          .attr('x2', center + width / 2)
          .attr('y1', function (d: any) {
            return y(d);
          })
          .attr('y2', function (d: any) {
            return y(d);
          })
          .attr('stroke', 'black');
      });
  }

  updateValues(values: any) {
    this.values = values;
    var node = document.getElementsByTagName('figure')[0]; //Removing the previous node on the screen
    while (node.firstChild) {
      node.removeChild(node.firstChild);
    }
    this.setup();
    this.createSvg();
    this.buildChart();
  }
}
