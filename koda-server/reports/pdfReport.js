const path = require('path');
// pdf drawing functions
// pdf graph for sleep
const formatMinutesShort = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (hours > 0 && mins > 0) {
        return `${hours}h ${mins}m`;
    }

    if (hours > 0) {
        return `${hours}h`;
    }

    return `${mins}m`;
};

// Draws the main PDF header
const drawReportHeader = (doc, range) => {
    const logoPath = path.join(
        __dirname,
        '../../koda-client/public/assets/koda-logo.png'
    );

    doc.image(
        logoPath,
        48,
        25,
        {
            fit: [80, 55]
        }
    );
    
    const pageWidth = doc.page.width;
    doc
        .fillColor('#222222')
        .font('Helvetica-Bold')
        .fontSize(18)
        .text('Koda Activity Report', 0, 32, {
            width: pageWidth,
            align: 'center',
            lineBreak: false
        });

    doc
        .fillColor('#8A7BC2')
        .font('Helvetica-Bold')
        .fontSize(11)
        .text(
            range === 'week' ? 'Weekly Report' : 'Daily Report', 0, 58, {
            width: pageWidth,
            align: 'center',
            lineBreak: false
        }
        );

    doc
        .strokeColor('#D9D9D9')
        .moveTo(48, 95)
        .lineTo(564, 95)
        .stroke();

    doc.y = 110;
};

const drawChildInformation = (doc, childInfo, reportInfo) => {
    const leftX = 48;
    const rightX = 325;
    const startY = 115;

    doc
        .fillColor('#315B3D')
        .font('Helvetica-Bold')
        .fontSize(10)
        .text('CHILD INFORMATION', leftX, startY);

    doc
        .text('REPORT DETAILS', rightX, startY);

    const childFields = [
        ['Name', childInfo.name],
        ['Date of Birth', childInfo.dob],
        ['Age', childInfo.age],
        ['Weight', childInfo.weight],
        ['Allergies', childInfo.allergies]
    ];

    let y = startY + 25;

    childFields.forEach(([label, value]) => {
        doc
            .fillColor('#222222')
            .font('Helvetica-Bold')
            .fontSize(9)
            .text(`${label}:`, leftX, y, {
                width: 90
            });

        doc
            .font('Helvetica')
            .text(value, leftX + 95, y, {
                width: 155
            });

        y += 20;
    });

    const reportFields = [
        ['Report Period', reportInfo.period],
        ['Report Type', reportInfo.type],
        ['Generated', reportInfo.generated]
    ];

    let reportY = startY + 25;

    reportFields.forEach(([label, value]) => {
        doc
            .fillColor('#222222')
            .font('Helvetica-Bold')
            .fontSize(9)
            .text(`${label}:`, rightX, reportY, {
                width: 85
            });

        doc
            .font('Helvetica')
            .text(value, rightX + 90, reportY, {
                width: 145
            });

        reportY += 20;
    });

    doc
        .strokeColor('#D9D9D9')
        .moveTo(48, 245)
        .lineTo(564, 245)
        .stroke();

    doc.y = 260;
};

// Draws a short summary of the child's logged activity
const drawActivitySummary = (doc, summaryText) => {
    const x = 48;
    const y = doc.y + 10;
    const width = 516;

    doc
        .fillColor('#315B3D')
        .font('Helvetica-Bold')
        .fontSize(10)
        .text('SUMMARY OF LOGGED ACTIVITY', x, y);

    const boxY = y + 22;

    doc
        .roundedRect(x, boxY, width, 75, 6)
        .fillAndStroke('#F7F9F7', '#D9E2DA');

    doc
        .fillColor('#333333')
        .font('Helvetica')
        .fontSize(9)
        .text(
            summaryText,
            x + 15,
            boxY + 15,
            {
                width: width - 30,
                lineGap: 3
            }
        );

    doc.y = boxY + 90;
};

// Draws the main activity totals for quick review
const drawAtAGlance = (doc, stats) => {
    const startX = 48;
    const startY = doc.y + 10;
    const totalWidth = 516;
    const gap = 10;

    doc
        .fillColor('#315B3D')
        .font('Helvetica-Bold')
        .fontSize(10)
        .text('AT A GLANCE', startX, startY);

    const items = [
        {
            label: 'Total Sleep',
            value: stats.totalSleep,
            detail: `Avg per Session: ${stats.averageSleep}`
        },
        {
            label: 'Feedings',
            value: String(stats.feedings),
            detail: `Avg per Day: ${stats.feedingPerDay}`
        },
        {
            label: 'Diaper Changes',
            value: String(stats.diapers),
            detail: `Avg per Day: ${stats.diaperPerDay}`
        },
        {
            label: 'Days Logged',
            value: stats.daysLogged,
            detail: stats.daysLoggedPercent
        }
    ];

    const boxWidth =
        (totalWidth - gap * 3) / 4;

    const boxY = startY + 24;
    const boxHeight = 78;

    items.forEach((item, index) => {
        const x =
            startX +
            index * (boxWidth + gap);

        // card outline
        doc
            .roundedRect(
                x,
                boxY,
                boxWidth,
                boxHeight,
                5
            )
            .strokeColor('#D9D9D9')
            .lineWidth(0.8)
            .stroke();

        // label
        doc
            .fillColor('#444444')
            .font('Helvetica-Bold')
            .fontSize(8)
            .text(
                item.label,
                x + 10,
                boxY + 12,
                {
                    width: boxWidth - 20,
                    align: 'center'
                }
            );

        // main value
        doc
            .fillColor('#315B3D')
            .font('Helvetica-Bold')
            .fontSize(14)
            .text(
                item.value,
                x + 5,
                boxY + 31,
                {
                    width: boxWidth - 10,
                    align: 'center'
                }
            );

        // smaller detail
        doc
            .fillColor('#666666')
            .font('Helvetica')
            .fontSize(7)
            .text(
                item.detail,
                x + 5,
                boxY + 56,
                {
                    width: boxWidth - 10,
                    align: 'center'
                }
            );
    });

    doc.y = boxY + boxHeight + 10;
};

// Draws the sleep trend chart 
const drawSleepChart = (doc, data, x, y, width, height) => {
    if (!data || data.length === 0) return;

    doc
        .fillColor('#8A7BC2')
        .font('Helvetica-Bold')
        .fontSize(9)
        .text('SLEEP DURATION (per day)', x, y, {
            width,
            align: 'left',
            lineBreak: false
        });

    const chartY = y + 25;
    const chartHeight = height - 45;
    const chartWidth = width - 10;
    const labelSpace = 12;
    const drawableHeight = chartHeight - labelSpace;
    const axisSpace = 18;
    const graphX = x + axisSpace;
    const graphWidth = chartWidth - axisSpace;
    const maxMinutes = Math.max(
        ...data.map((item) => item.minutes),
        1);
    const maxHours = Math.max(
        Math.ceil(maxMinutes / 60),
        1);

    const axisMaxMinutes = maxHours * 60;

    const gap = 3;
    const availableBarWidth =
        (graphWidth - gap * (data.length - 1)) / data.length;
    const barWidth = Math.min(18, availableBarWidth);
    const usedWidth =
        barWidth * data.length +
        gap * (data.length - 1);
    const chartOffset =
        (graphWidth - usedWidth) / 2;

    // bottom line
    doc
        .strokeColor('#D9D9D9')
        .moveTo(graphX, chartY + drawableHeight)
        .lineTo(graphX + graphWidth, chartY + drawableHeight)
        .stroke();
    // Y axis
    doc
        .strokeColor('#BEBEBE')
        .moveTo(graphX, chartY)
        .lineTo(graphX, chartY + drawableHeight)
        .stroke();

    doc
        .fillColor('#666666')
        .font('Helvetica')
        .fontSize(5)
        .text('Hours', x, chartY - 9, {
            width: axisSpace + 10,
            lineBreak: false
        });

    const sleepTicks = [
        { value: maxHours, y: chartY },
        {
            value: maxHours / 2,
            y: chartY + drawableHeight / 2
        },
        {
            value: 0,
            y: chartY + drawableHeight
        }
    ];

    sleepTicks.forEach((tick) => {
        doc
            .fillColor('#666666')
            .fontSize(5)
            .text(
                Number.isInteger(tick.value)
                    ? String(tick.value)
                    : tick.value.toFixed(1),
                x,
                tick.y - 3,
                {
                    width: axisSpace - 3,
                    align: 'right',
                    lineBreak: false
                }
            );
    });
    data.forEach((item, index) => {
        const barHeight =
            (item.minutes / axisMaxMinutes) * drawableHeight;

        const barX = graphX + chartOffset + index * (barWidth + gap);

        const barY =
            chartY + drawableHeight - barHeight;

        if (item.minutes > 0) {
            doc
                .fillColor('#8A7BC2')
                .rect(
                    barX,
                    barY,
                    barWidth,
                    barHeight
                )
                .fill();

            // Only show values when there is actual sleep data
            doc
                .fillColor('#333333')
                .font('Helvetica')
                .fontSize(6)
                .text(
                    formatMinutesShort(item.minutes),
                    barX - 3,
                    barY - 10,
                    {
                        width: barWidth + 6,
                        align: 'center',
                        lineBreak: false
                    }
                );
        }

        doc
            .fillColor('#666666')
            .font('Helvetica')
            .fontSize(6)
            .text(
                item.label,
                barX - 2,
                chartY + chartHeight + 5,
                {
                    width: barWidth + 4,
                    align: 'center',
                    lineBreak: false
                }
            );
        if (item.dateLabel) {
            doc
                .fillColor('#777777')
                .font('Helvetica')
                .fontSize(5)
                .text(
                    item.dateLabel,
                    barX - 2,
                    chartY + chartHeight + 13,
                    {
                        width: barWidth + 4,
                        align: 'center',
                        lineBreak: false
                    }
                );
        }
    });
};

// Draws the feeding trend chart in a fixed position on the PDF
const drawFeedingChart = (doc, data, range, x, y, width, height
) => {
    if (!data || data.length === 0) return;

    doc
        .fillColor('#315B3D')
        .font('Helvetica-Bold')
        .fontSize(9)
        .text(
            'FEEDING AMOUNT (per day)',
            x,
            y,
            {
                width,
                align: 'left',
                lineBreak: false
            }
        );

    const chartY = y + 25;
    const chartHeight = height - 45;
    const chartWidth = width - 10;
    const yAxisLabel = 'Ounces (oz)';
    doc
        .fillColor('#666666')
        .font('Helvetica')
        .fontSize(5)
        .text(
            yAxisLabel,
            x,
            chartY - 9,
            {
                width: 55,
                lineBreak: false
            }
        );
    const labelSpace = 12;
    const drawableHeight = chartHeight - labelSpace;
    const axisSpace = 18;
    const graphX = x + axisSpace;
    const graphWidth = chartWidth - axisSpace;
    const values = data.map((item) =>
        item.ounces
    );

    const maxValue = Math.max(...values, 1);

    // Y axis
    doc
        .strokeColor('#BEBEBE')
        .moveTo(graphX, chartY)
        .lineTo(graphX, chartY + drawableHeight)
        .stroke();

    // Y axis numbers
    const feedingTicks = [
        {
            value: maxValue,
            y: chartY
        },
        {
            value: Math.round(maxValue / 2),
            y: chartY + drawableHeight / 2
        },
        {
            value: 0,
            y: chartY + drawableHeight
        }
    ];

    feedingTicks.forEach((tick) => {
        doc
            .fillColor('#666666')
            .fontSize(5)
            .text(
                String(tick.value),
                x,
                tick.y - 3,
                {
                    width: axisSpace - 3,
                    align: 'right',
                    lineBreak: false
                }
            );
    });
    const gap = 3;
    const availableBarWidth =
        (graphWidth - gap * (data.length - 1)) / data.length;
    const barWidth = Math.min(18, availableBarWidth);
    const usedWidth =
        barWidth * data.length +
        gap * (data.length - 1);
    const chartOffset =
        (graphWidth - usedWidth) / 2;

    doc
        .strokeColor('#D9D9D9')
        .moveTo(graphX, chartY + drawableHeight)
        .lineTo(graphX + chartWidth, chartY + drawableHeight)
        .stroke();

    data.forEach((item, index) => {
        const value = item.ounces

        const barHeight =
            (value / maxValue) * drawableHeight;

        const barX = graphX + chartOffset + index * (barWidth + gap);

        const barY =
            chartY + drawableHeight - barHeight;

        if (value > 0) {
            doc
                .fillColor('#789F75')
                .rect(
                    barX,
                    barY,
                    barWidth,
                    barHeight
                )
                .fill();

            doc
                .fillColor('#333333')
                .font('Helvetica')
                .fontSize(6)
                .text(
                    `${value} oz`,
                    barX - 3,
                    barY - 10,
                    {
                        width: barWidth + 6,
                        align: 'center',
                        lineBreak: false
                    }
                );
        }

        doc
            .fillColor('#666666')
            .font('Helvetica')
            .fontSize(6)
            .text(
                item.label,
                barX - 2,
                chartY + chartHeight + 5,
                {
                    width: barWidth + 4,
                    align: 'center',
                    lineBreak: false
                }
            );
        if (item.dateLabel) {
            doc
                .fillColor('#777777')
                .font('Helvetica')
                .fontSize(5)
                .text(
                    item.dateLabel,
                    barX - 2,
                    chartY + chartHeight + 13,
                    {
                        width: barWidth + 4,
                        align: 'center',
                        lineBreak: false
                    }
                );
        }
    });
};

// the diaper breakdown as a donut chart
const drawDiaperSummary = (
    doc,
    summary,
    x,
    y,
    width,
    height
) => {
    if (!summary || summary.total === 0) return;

    doc
        .fillColor('#E67E22')
        .font('Helvetica-Bold')
        .fontSize(9)
        .text('DIAPER BREAKDOWN', x, y, {
            width,
            align: 'left',
            lineBreak: false
        });

    const centerX = x + 50;
    const centerY = y + 75;
    const radius = 35;

    const items = [
        {
            label: 'Wet',
            value: summary.counts.Wet,
            color: '#5B8FD1'
        },
        {
            label: 'Dirty',
            value: summary.counts.Dirty,
            color: '#789F75'
        },
        {
            label: 'Mixed',
            value: summary.counts.Mixed,
            color: '#E89A45'
        }
    ];

    let startAngle = -Math.PI / 2;

    items.forEach((item) => {
        if (item.value === 0) return;

        const sliceAngle =
            (item.value / summary.total) *
            Math.PI *
            2;

        const endAngle =
            startAngle + sliceAngle;

        const startX =
            centerX +
            radius * Math.cos(startAngle);

        const startY =
            centerY +
            radius * Math.sin(startAngle);

        const endX =
            centerX +
            radius * Math.cos(endAngle);

        const endY =
            centerY +
            radius * Math.sin(endAngle);

        const largeArc =
            sliceAngle > Math.PI ? 1 : 0;

        const path =
            `M ${centerX} ${centerY} ` +
            `L ${startX} ${startY} ` +
            `A ${radius} ${radius} 0 ${largeArc} 1 ${endX} ${endY} Z`;

        doc
            .path(path)
            .fill(item.color);

        startAngle = endAngle;
    });

    // White center makes it a donut
    doc
        .fillColor('#FFFFFF')
        .circle(centerX, centerY, 18)
        .fill();

    doc
        .fillColor('#222222')
        .font('Helvetica-Bold')
        .fontSize(10)
        .text(
            String(summary.total),
            centerX - 15,
            centerY - 7,
            {
                width: 30,
                align: 'center',
                lineBreak: false
            }
        );

    doc
        .font('Helvetica')
        .fontSize(5)
        .fillColor('#666666')
        .text(
            'TOTAL',
            centerX - 15,
            centerY + 5,
            {
                width: 30,
                align: 'center',
                lineBreak: false
            }
        );

    // Legend
    let legendY = y + 48;
    const legendX = x + 95;

    items.forEach((item) => {
        const percentage =
            Math.round(
                (item.value / summary.total) * 100
            );

        doc
            .fillColor(item.color)
            .circle(
                legendX,
                legendY + 3,
                3
            )
            .fill();

        doc
            .fillColor('#333333')
            .font('Helvetica')
            .fontSize(6)
            .text(
                `${item.label} ${item.value} (${percentage}%)`,
                legendX + 8,
                legendY,
                {
                    width: width - 105,
                    lineBreak: false
                }
            );

        legendY += 16;
    });
};;

// All three report charts inside one organized chart section
const drawChartsPanel = (
    doc,
    sleepData,
    feedingData,
    diaperSummary,
    range,
    chartStats,
    y
) => {
    const x = 48;
    const totalWidth = 516;
    const totalHeight = 190;

    const columnGap = 14;
    const columnWidth = 162;

    doc
        .roundedRect(
            x,
            y,
            totalWidth,
            totalHeight,
            6
        )
        .strokeColor('#D9D9D9')
        .lineWidth(0.8)
        .stroke();

    // Vertical separators
    const separatorOne = x + columnWidth + 7;
    const separatorTwo =
        x + (columnWidth * 2) + columnGap + 7;

    doc
        .strokeColor('#E2E2E2')
        .moveTo(separatorOne, y + 12)
        .lineTo(separatorOne, y + totalHeight - 12)
        .stroke();

    doc
        .moveTo(separatorTwo, y + 12)
        .lineTo(separatorTwo, y + totalHeight - 12)
        .stroke();

    const chartY = y + 14;
    const chartHeight = 130;

    // Sleep
    drawSleepChart(
        doc,
        sleepData,
        x + 10,
        chartY,
        columnWidth - 20,
        chartHeight
    );

    // Feeding
    drawFeedingChart(
        doc,
        feedingData,
        range,
        x + columnWidth + columnGap,
        chartY,
        columnWidth - 20,
        chartHeight
    );

    // Diaper
    drawDiaperSummary(
        doc,
        diaperSummary,
        x + (columnWidth * 2) + (columnGap * 2),
        chartY,
        columnWidth - 18,
        chartHeight
    );

    // summary boxes
    const summaryY = y + totalHeight - 36;
    const summaryHeight = 24;

    const summaries = [
        {
            x: x + 10,
            text: `Avg per Day: ${chartStats.sleepPerDay}`
        },
        {
            x: x + columnWidth + columnGap,
            text: `Avg per Day: ${chartStats.feedingPerDay}`
        },
        {
            x:
                x +
                (columnWidth * 2) +
                (columnGap * 2),
            text: `Avg per Day: ${chartStats.diaperPerDay}`
        }
    ];

    summaries.forEach((item) => {
        doc
            .roundedRect(
                item.x,
                summaryY,
                columnWidth - 20,
                summaryHeight,
                4
            )
            .strokeColor('#D9D9D9')
            .lineWidth(0.6)
            .stroke();

        doc
            .fillColor('#555555')
            .font('Helvetica')
            .fontSize(7)
            .text(
                item.text,
                item.x,
                summaryY + 8,
                {
                    width: columnWidth - 20,
                    align: 'center',
                    lineBreak: false
                }
            );
    });

    doc.y = y + totalHeight + 10;
};

module.exports = {
    drawReportHeader,
    drawChildInformation,
    drawActivitySummary,
    drawAtAGlance,
    drawSleepChart,
    drawFeedingChart,
    drawDiaperSummary,
    drawChartsPanel
};