import { convergenceHistory, convergenceTolerances } from '../simulation/state.js';

export function drawConvergenceChart(canvas) {
    
    if (!canvas) return; // safety check
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    ctx.fillRect(0, 0, width, height);

    if (convergenceHistory.velocity.length < 2) return;

    //find range for logarithmic scale
    const allValues = [...convergenceHistory.velocity, ...convergenceHistory.pressure, ...convergenceHistory.mass];
    const minVal = Math.max(1e-12, Math.min(...allValues));
    const maxVal = Math.max(minVal * 1.01, Math.max(...allValues));

    const logMin = Math.log10(minVal);
    const logMax = Math.log10(maxVal);
    const logRange = logMax - logMin;

    if (logRange <= 0) return;

    // Draw Grid
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 1;

    //horizontal grid lines (power of 10)
    for (let power = Math.floor(logMin); power <= Math.ceil(logMax); power++) {
        const y = height - ((power - logMin) / logRange) * height;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();

        //labels
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.font = '10px Arial';
        ctx.fillText(`1e${power}`, 5, y - 2);
    }

    //Vertical grid lines
    const stepSize = Math.max(1, Math.floor(convergenceHistory.velocity.length / 5));

    for (let i = 0; i < convergenceHistory.velocity.length; i += stepSize) {
        const x = convergenceHistory.velocity.length > 1 ? (i / (convergenceHistory.velocity.length - 1)) * width : 0;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
    }

    //Draw convergence lines
    const datasets = [
        { data: convergenceHistory.velocity, color: 'blue', label: 'Velocity' },
        { data: convergenceHistory.pressure, color: 'green', label: 'Pressure' },
        { data: convergenceHistory.mass, color: 'red', label: 'Mass' }
    ];

    datasets.forEach(dataset => {
        if (dataset.data.length < 2) return;

        ctx.strokeStyle = dataset.color;
        ctx.lineWidth = 2;
        ctx.beginPath();

        for (let i = 0; i < dataset.data.length; i++) {
            const x = (i / (dataset.data.length - 1)) * width;
            const logValue = Math.log10(Math.max(1e-12, dataset.data[i]));
            const y = height - ((logValue - logMin) / logRange) * height;

            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }

        ctx.stroke();
    });

    //draw tolerance lines
    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);

    const tolerances = [
        convergenceTolerances.velocity,
        convergenceTolerances.pressure, 
        convergenceTolerances.mass
    ];

    tolerances.forEach((tol) => {
        if (tol <= 0) return;
        const logTol = Math.log10(tol);
        const y = height - ((logTol - logMin) / logRange) * height;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
    });

    ctx.setLineDash([]);

}