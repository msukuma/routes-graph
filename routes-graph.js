const Graph = require('./graph');
const PriorityQueue = require('qheap');
const LinkedList = require('./linked-list');
const { NO_ROUTE } = require('./constants');

module.exports = class RoutesGraph extends Graph {
  constructor(data) {
    super(data);
  }

  distance(route) {
    route = route.trim();

    if (!/^[A-Z](-[A-Z])+$/.test(route)) {
      throw new Error('route must math regex /^[A-Z](-[A-Z])+$/');
    }

    const nodes = route.split('-');
    const len = nodes.length - 1;
    let dist = 0;

    for (let i = 0, edge; i < len; i++) {
      edge = this.getEdge(nodes[i], nodes[i + 1]);
      if (!edge) return NO_ROUTE;
      dist += edge.distance;
    }

    return dist;
  }

  numRoutes({ from, to, maxStops, exactStops, maxDistance }) {
    if (!(maxStops || exactStops || maxDistance)) {
      throw new Error('one of [maxStops, exactStops, maxDistance] must be passed value > 0');
    }

    let method, condition;
    let routes = 0;
    let nodesOnly = true;

    if (maxStops) {
      method = this._maxStops;
      condition = maxStops;
    }
    else if (exactStops) {
      method = this._exactStops;
      condition = exactStops;
    }
    else if (maxDistance) {
      method = this._maxDistance;
      condition = maxDistance;
      nodesOnly = false;
    }

    if (method) {
      const edges = this.getEdges(from);
      if (edges) {
        for (let edge of edges) {
          from = nodesOnly ? edge.to : edge;
          routes += method.call(this, from, to, condition, 0);
        }
      }
    }

    return routes;
  }

  _maxStops(cur, to, maxStops, numStops) {
    let routes = 0;

    if (cur === to) routes++;

    numStops++;

    if (numStops < maxStops) {
      const edges = this.getEdges(cur);

      if (edges)
        for (let edge of edges)
          routes += this._maxStops(edge.to, to, maxStops, numStops);

    }

    return routes;
  }

  _exactStops(cur, to, stops, numStops) {
    let routes = 0;

    if (numStops === stops) {
      if (cur === to) routes++;
    } else {
      numStops++;

      const edges = this.getEdges(cur);

      if (edges)
        for (let edge of edges)
          routes += this._exactStops(edge.to, to, stops, numStops);
    }

    return routes;
  }

  _maxDistance(cur, to, maxDistance, distance) {
    let routes = 0;

    distance += cur.distance;
    if (distance < maxDistance) {
      if (cur.to === to) {
        routes++;
      }

      const edges = this.getEdges(cur.to);
      if (edges)
        for (let edge of edges)
          routes += this._maxDistance(edge, to, maxDistance, distance);

    }

    return routes;
  }

  shortestRoute(from, to) {
    let cur, edges, parents;
    const parentMap = new Map();
    const q = new PriorityQueue({ comparBefore: (a, b) => a.distance < b.distance });

    edges = this.getEdges(from);
    if (edges)
      for (let edge of edges)
        q.enqueue(edge);

    while (q.length) {
      cur = q.dequeue();

      if (cur.to === to)
        return getDistance(cur, parentMap);

      edges = this.getEdges(cur.to);

      if (edges) {
        for (let edge of edges) {
          q.enqueue(edge);
          parents = parentMap.get(edge);
          if (parents) {
            parents.addFirst(cur);
          } else {
            parents = new LinkedList();
            parents.addFirst(cur);
            parentMap.set(edge, parents);
          }
        }
      }
    }

    return -1;
  }
};

function getDistance(node, parentMap) {
  let parents;
  let cur = node;
  let distance = 0;

  while (true) {
    distance += cur.distance;
    parents = parentMap.get(cur);
    if (!parents) return distance;
    cur = parents.removeFirst();
  }
}
