d3.csv("data/pokemon_alopez247.csv").then(data => {
   data.forEach(d => {
     d.Attack = +d.Attack;
     d.Defense = +d.Defense;
     d.HP = +d.HP;
     d.Speed = +d.Speed;
     d.SpAtk = +d.SpAtk;
     d.SpDef = +d.SpDef;
   });
 
   drawBarChart(data);
 
   drawScatterPlot(data, brushedData => {
     drawParallelCoords(data, brushedData);  // Highlight subset
   });
 
   drawParallelCoords(data);  // Full initial view
 });
 
 function drawBarChart(data) {
   const svg = d3.select("#barChart svg"),
         width = +svg.attr("width"),
         height = +svg.attr("height"),
         margin = { top: 20, right: 20, bottom: 80, left: 50 };
 
   const typeCounts = d3.rollup(data, v => v.length, d => d.Type1);
   const x = d3.scaleBand()
               .domain(Array.from(typeCounts.keys()))
               .range([margin.left, width - margin.right])
               .padding(0.1);
   const y = d3.scaleLinear()
               .domain([0, d3.max(typeCounts.values())])
               .nice()
               .range([height - margin.bottom, margin.top]);
 
   svg.selectAll("rect")
      .data(Array.from(typeCounts.entries()))
      .enter().append("rect")
      .attr("x", d => x(d[0]))
      .attr("y", d => y(d[1]))
      .attr("width", x.bandwidth())
      .attr("height", d => height - margin.bottom - y(d[1]))
      .attr("fill", "steelblue");
 
   svg.append("g")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x))
      .selectAll("text")
      .attr("transform", "rotate(-40)")
      .style("text-anchor", "end");
 
   svg.append("g")
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3.axisLeft(y));
 
   svg.append("text")
      .attr("x", width / 2)
      .attr("y", height - 10)
      .attr("text-anchor", "middle")
      .attr("font-size", "12px")
      .text("Type 1");
 
   svg.append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -height / 2)
      .attr("y", 15)
      .attr("text-anchor", "middle")
      .attr("font-size", "12px")
      .text("Count");
 }
 
 function drawScatterPlot(data, onBrushSelection) {
   const svg = d3.select("#scatterPlot svg"),
         width = +svg.attr("width"),
         height = +svg.attr("height"),
         margin = { top: 20, right: 20, bottom: 50, left: 60 };
 
   const x = d3.scaleLinear()
               .domain(d3.extent(data, d => d.Attack))
               .nice()
               .range([margin.left, width - margin.right]);
 
   const y = d3.scaleLinear()
               .domain(d3.extent(data, d => d.Defense))
               .nice()
               .range([height - margin.bottom, margin.top]);
 
   const colorScale = d3.scaleOrdinal(d3.schemeCategory10)
                        .domain([...new Set(data.map(d => d.Type1))]);
 
   const circles = svg.selectAll("circle")
     .data(data)
     .enter().append("circle")
     .attr("cx", d => x(d.Attack))
     .attr("cy", d => y(d.Defense))
     .attr("r", 4)
     .attr("fill", d => colorScale(d.Type1))
     .attr("opacity", 0.6);
 
   svg.append("g")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x).ticks(5));
 
   svg.append("g")
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3.axisLeft(y));
 
   svg.append("text")
      .attr("x", width / 2)
      .attr("y", height - 10)
      .attr("text-anchor", "middle")
      .attr("font-size", "12px")
      .text("Attack");
 
   svg.append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -height / 2)
      .attr("y", 15)
      .attr("text-anchor", "middle")
      .attr("font-size", "12px")
      .text("Defense");
 
   const legend = svg.append("g")
                     .attr("transform", `translate(${width - 120}, 30)`);
   const types = colorScale.domain().slice(0, 5);
   types.forEach((type, i) => {
     legend.append("circle").attr("cx", 0).attr("cy", i * 20).attr("r", 5).attr("fill", colorScale(type));
     legend.append("text").attr("x", 10).attr("y", i * 20 + 5).text(type).attr("font-size", "10px");
   });
 
   const brush = d3.brush()
     .extent([[margin.left, margin.top], [width - margin.right, height - margin.bottom]])
     .on("brush end", ({ selection }) => {
       if (!selection) {
         circles.transition().duration(200).attr("opacity", 0.6);
         onBrushSelection([]);
         return;
       }
       const [[x0, y0], [x1, y1]] = selection;
       const brushedData = data.filter(d => {
         const cx = x(d.Attack), cy = y(d.Defense);
         return cx >= x0 && cx <= x1 && cy >= y0 && cy <= y1;
       });
 
       circles.transition().duration(200)
         .attr("opacity", d => brushedData.includes(d) ? 1.0 : 0.1);
 
       onBrushSelection(brushedData);
     });
 
   svg.append("g").call(brush);
 }
 
 function drawParallelCoords(data, highlighted = []) {
   const root = d3.select("#parallelCoords svg");
   root.selectAll("*").remove(); // Clear previous
   const svg = root.append("g"); // Zoomable group
 
   const width = 800, height = 300;
   const margin = { top: 30, right: 10, bottom: 10, left: 10 };
 
   const dimensions = ["HP", "Attack", "Defense", "Speed"];
   const yScales = {};
   dimensions.forEach(dim => {
     yScales[dim] = d3.scaleLinear()
       .domain(d3.extent(data, d => d[dim]))
       .range([height - margin.bottom, margin.top]);
   });
 
   const x = d3.scalePoint()
     .domain(dimensions)
     .range([margin.left, width - margin.right]);
 
   const path = d => d3.line()(dimensions.map(p => [x(p), yScales[p](d[p])]));
 
   svg.selectAll("path")
      .data(data)
      .enter().append("path")
      .attr("d", path)
      .attr("fill", "none")
      .attr("stroke", d => highlighted.includes(d) ? "orange" : "purple")
      .attr("stroke-width", 1.5)
      .attr("stroke-opacity", d => highlighted.includes(d) ? 0.9 : 0.1)
      .transition().duration(300);
 
   svg.selectAll("g.axis")
      .data(dimensions)
      .enter().append("g")
      .attr("class", "axis")
      .attr("transform", d => `translate(${x(d)},0)`)
      .each(function(d) {
        d3.select(this).call(d3.axisLeft(yScales[d]));
      })
      .append("text")
      .style("text-anchor", "middle")
      .attr("y", margin.top - 10)
      .text(d => d)
      .attr("fill", "black");
 
   root.call(d3.zoom().on("zoom", (event) => {
     svg.attr("transform", event.transform);
   }));
 }
 