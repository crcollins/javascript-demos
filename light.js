function Circle(center, radius) {
    this.center = new Vector(center);
    this.radius = radius;

    this.intersect = function (ray) {
        var f = ray.start.sub(this.center);

        var a = ray.direction.dot(ray.direction);
        var b = 2*f.dot(ray.direction);
        var c = f.dot(f) - this.radius * this.radius;
        var discriminant = b*b - 4*a*c;
        if (discriminant < 0) {
            return Infinity;
        }
        discriminant = Math.sqrt(discriminant);
        var t1 = (-b - discriminant) / (2 * a);
        var t2 = (-b + discriminant) / (2 * a);
        if (t1 < 0 && t2 < 0) {
            return -Infinity;
        }
        if (t1 < 0) return t2-0.005;        // FLOOOOOAAAATTTTSSS!
        else if (t2 < 0) return t1-0.005;   // FLOOOOOAAAATTTTSSS!
        return Math.min(t1, t2)-0.005;      // FLOOOOOAAAATTTTSSS!
    };

    this.normal = function (coord) {
        return coord.sub(this.center).normalized();
    };

    this.render = function (ctx) {
        ctx.save();
        ctx.strokeStyle = "#00FF00";
        ctx.moveTo(this.center.x(), this.center.y());
        ctx.beginPath();
        ctx.arc(this.center.x(), this.center.y(), this.radius, 0, 2 * Math.PI);
        ctx.stroke();
        ctx.restore();
    };
}

function LineSeg(start, end) {
    this.start = start;
    this.end = end;
    this.length = function () {
        return this.start.distance(this.end);
    };
    this.direction = function () {
        return this.end.sub(this.start).normalized();
    };

    this.normal = function (coord) {
        return this.direction().rotate2d(Math.PI/2);
    };

    this.intersect = function (ray) {
        var m0 = ray.direction;
        var m1 = this.direction();

        var temp = m0.cross(m1);
        if (Math.abs(temp.z()) - 0.00005 < 0) {
            return Infinity;
        }
        var x0 = m1.cross(ray.start.sub(this.start)).div(temp).z();
        if (x0 < 0) {
            return -Infinity;
        }
        var x1 = m0.cross(this.start.sub(ray.start)).div(temp.negate()).z()/this.length();
        if (x1 < 0 || x1 > 1) {
            return Infinity;
        }
        return x0-0.005; // FLOOOOOAAAATTTTSSS!
    };

    this.render = function (ctx) {
        ctx.save();
        ctx.strokeStyle = "#00FF00";
        ctx.beginPath();
        ctx.moveTo(this.start.x(), this.start.y());
        ctx.lineTo(this.end.x(), this.end.y());
        ctx.stroke();
        ctx.restore();
    };
}


function propogateRay(ray, objects, maxbounces) {
    var points = [];
    var dist;
    var idx;
    var temp;
    do {
        dist = Infinity;
        idx = 0;
        points.push(ray.start.comp);
        for (var i = 0; i < objects.length; i++) {
            temp = objects[i].intersect(ray);
            if ((temp < dist) && (temp > 0)) {
                dist = temp;
                idx = i;
            }
        }
        if (dist < Infinity) {
            ray = ray.reflect(objects[idx], dist);
        }
    } while (dist > 0 && dist != Infinity && points.length < maxbounces + 2);
    if (points.length < maxbounces + 2) {
        points.push(ray.start.add(ray.direction.mul(1000)).comp);
    }
    return points;
}


function Ray(start, direction) {
    this.start = new Vector(start);
    this.direction = new Vector(direction).normalized();

    this.end = function (length) {
        return this.start.add(this.direction.mul(length));
    };

    this.reflect = function (other, t) {
        var intersection = this.start.add(this.direction.mul(t));
        var temp = other.normal(intersection);
        var dir = this.direction.sub(temp.mul(2).mul(temp.dot(this.direction)));
        return new Ray(intersection, dir);
    };
}


$(document).ready(function () {
    var canvas = document.getElementById("light");
    var ctx = canvas.getContext("2d");
    writeString(canvas, "Hover");
    ctx.fillStyle = "#222222";

    var maxbounces = 50;
    var maxbounceelement = $("#maxbounces");
    maxbounceelement.focusout(function () { maxbounces = parseInt(maxbounceelement.val()); });
    maxbounceelement.keydown(function (e) {
        if (e.which == 13) maxbounces = parseInt(maxbounceelement.val());
    });

    var drawtype = 'line';
    var drawtypeelement = $("input[name=drawtype]");
    drawtypeelement.click(function () { drawtype = $('input[name=drawtype]:checked').val(); });

    var lines = [
        new LineSeg(new Vector(400, 100), new Vector(100, 100)),
        new LineSeg(new Vector(100, 100), new Vector(100, 400)),
        new LineSeg(new Vector(100, 400), new Vector(400, 400)),
        new Circle(new Vector(400, 200), 50),
        new Circle(new Vector(100, 300), 50),
    ];

    var center = new Vector(canvas.width/2, canvas.height/2);
    $(canvas).mousemove(function (e) {
        var p = getPos(e, canvas);
        var pvec = new Vector(p.x, p.y);
        var ray = new Ray(center, pvec.sub(center));
        var points = propogateRay(ray, lines, maxbounces);

        ctx.fillRect(0,0,canvas.width, canvas.height);
        ctx.beginPath();
        ctx.strokeStyle = '#FFFFFF';
        ctx.moveTo(points[0][0], points[0][1]);
        for (var i = 1; i < points.length; i++) {
            ctx.lineTo(points[i][0], points[i][1]);
        }
        ctx.stroke();

        for (var i=0; i < lines.length; i++) {
            lines[i].render(ctx);
        }
    });

    var start = null;
    $(canvas).click(function (e) {
        var p = getPos(e, canvas);
        var pvec = new Vector(p.x, p.y);
        if (start) {
            switch (drawtype) {
                case "line":
                    lines.push(new LineSeg(start, pvec));
                    break;
                case "circle":
                    lines.push(new Circle(start, start.sub(pvec).magnitude()));
                    break;
            }
            lines[lines.length-1].render(ctx);
            start = null;
        } else {
            start = pvec;
        }
    });
});