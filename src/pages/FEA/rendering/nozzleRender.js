export function createNozzleGeometry() {
    const cp = controlPoints;

    ctx.save();
    ctx.translate(0, canvas.height / 2);

    ctx.beginPath();

    ctx.moveTo(0, cp.inlet_radius * scaleY);
    
    ctx.lineTo(cp.inlet_length, cp.inlet_radius * scaleY);
    ctx.quadraticCurveTo(cp.cp1x, cp.cp1y * scaleY, cp.throat_x, cp.throat_radius * scaleY);
    ctx.quadraticCurveTo(cp.cp2x, cp.cp2y * scaleY, cp.switcher_x, cp.switcher_y * scaleY);
    ctx.quadraticCurveTo(cp.cp3x, cp.cp3y * scaleY, cp.exit_x, cp.exit_radius * scaleY);
    
    ctx.lineTo(cp.exit_x, -cp.exit_radius * scaleY);    
    ctx.quadraticCurveTo(cp.cp3x, -cp.cp3y * scaleY, cp.switcher_x, -cp.switcher_y * scaleY);
    ctx.quadraticCurveTo(cp.cp2x, -cp.cp2y * scaleY, cp.throat_x, -cp.throat_radius * scaleY);
    ctx.quadraticCurveTo(cp.cp1x, -cp.cp1y * scaleY, cp.inlet_length, -cp.inlet_radius * scaleY);
    ctx.lineTo(0, -cp.inlet_radius  * scaleY);
    
    ctx.closePath();

    ctx.strokeStyle = '#444';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.restore();
}