document.querySelector('#menu-header').addEventListener('click', (e) => {
    document.querySelector('#menu').classList.toggle('is-closed');
});

document.querySelector('#rainbow').addEventListener('click', (e) => {
    drawRainbows = !drawRainbows;
    e.target.innerText = `${
        drawRainbows ? 'Turn off' : 'Turn on'
    } rainbow points`;
    if (typeof scheduleShareUpdate === 'function') scheduleShareUpdate();
    // draw();
});

document.querySelector('#basisvecs').addEventListener('click', (e) => {
    drawBasisVecs = !drawBasisVecs;
    e.target.innerText = `${drawBasisVecs ? 'Turn off' : 'Turn on'} î and ĵ`;

    if (drawBasisVecs) {
        basisDraggingCursorI.classList.remove('is-hidden');
        basisDraggingCursorJ.classList.remove('is-hidden');
    } else {
        basisDraggingCursorI.classList.add('is-hidden');
        basisDraggingCursorJ.classList.add('is-hidden');
    }
    if (typeof scheduleShareUpdate === 'function') scheduleShareUpdate();
    // draw();
});

document.querySelector('#grid').addEventListener('click', (e) => {
    drawGridLines = !drawGridLines;
    e.target.innerText = `${drawGridLines ? 'Turn off' : 'Turn on'} grid`;
    if (typeof scheduleShareUpdate === 'function') scheduleShareUpdate();
    // draw();
});

document.querySelector('#veclabels').addEventListener('click', (e) => {
    drawVectorLabels = !drawVectorLabels;
    e.target.innerText = `${
        drawVectorLabels ? 'Turn off' : 'Turn on'
    } object labels`;
    if (typeof scheduleShareUpdate === 'function') scheduleShareUpdate();
    // draw();
});

document.querySelector('#speed').addEventListener('click', (e) => {
    animSpeed = (animSpeed + 1) % ANIM_SPEEDS.length;
    e.target.innerText = `Change animation speed (${ANIM_SPEEDS[animSpeed].name})`;
    if (typeof scheduleShareUpdate === 'function') scheduleShareUpdate();
    // draw();
});

document.querySelector('#size').addEventListener('click', (e) => {
    gridSize = (gridSize + 1) % GRID_SIZES.length;
    e.target.innerText = `Change grid size (${GRID_SIZES[gridSize].name})`;
    if (typeof scheduleShareUpdate === 'function') scheduleShareUpdate();
    // draw();
});

const draggablesContainer = document.querySelector('#draggables-container');

const vectorTemplate = document.querySelector('#vector-card');
const vectorList = document.querySelector('#vectorlist');
const addVector = document.querySelector('#addvector');

let vecIdTracker = 0;

const createVectorCard = (initial = {}) => {
    const vectorCard = vectorTemplate.content.firstElementChild.cloneNode(true);

    let id;
    if (typeof initial.id === 'number' && initial.id >= 0) {
        id = initial.id;
        vecIdTracker = Math.max(vecIdTracker, id + 1);
    } else {
        id = vecIdTracker++;
    }

    vectorCard.dataset.id = id;

    const draggingCursor = document.createElement('div');
    draggingCursor.classList.add('dragging-cursor');
    draggablesContainer.appendChild(draggingCursor);

    const vectorDefaults = {
        isActive: true,
        vec: { x: 1, y: 1 },
        color: colorToString(randomColor()),
    };

    const initialVec = {
        x:
            typeof initial.vec?.x === 'number'
                ? initial.vec.x
                : vectorDefaults.vec.x,
        y:
            typeof initial.vec?.y === 'number'
                ? initial.vec.y
                : vectorDefaults.vec.y,
    };

    const isActive =
        typeof initial.isActive === 'boolean'
            ? initial.isActive
            : vectorDefaults.isActive;
    const color = initial.color || vectorDefaults.color;

    vectors.push({
        id,
        isActive,
        color,
        vec: { x: initialVec.x, y: initialVec.y },
        cursor: draggingCursor,
    });

    vectorCard.querySelector('.delete').addEventListener('click', () => {
        vectorCard.remove();
        draggingCursor.remove();
        const index = vectors.findIndex((vec) => vec.id === id);
        if (index > -1) vectors.splice(index, 1);
        if (typeof scheduleShareUpdate === 'function') scheduleShareUpdate();
        // draw();
    });

    const checkbox = vectorCard.querySelector('.enable');
    checkbox.checked = isActive;

    const setCheckboxStyle = () => {
        checkbox.style.backgroundColor = checkbox.checked
            ? vectors.find((vec) => vec.id === id)?.color || null
            : null;
        if (checkbox.checked) {
            draggingCursor.classList.remove('is-hidden');
        } else {
            draggingCursor.classList.add('is-hidden');
        }
    };

    setCheckboxStyle();

    checkbox.addEventListener('change', () => {
        const index = vectors.findIndex((vec) => vec.id === id);
        vectors[index] = {
            ...vectors[index],
            isActive: checkbox.checked,
        };
        setCheckboxStyle();
        if (typeof scheduleShareUpdate === 'function') scheduleShareUpdate();
        // draw();
    });

    const cellX = vectorCard.querySelector('.cell.x');
    const cellY = vectorCard.querySelector('.cell.y');

    cellX.value = initialVec.x;
    cellY.value = initialVec.y;

    const readVectorValues = () => {
        const asNumX = parseNumberInput(cellX.value);
        const asNumY = parseNumberInput(cellY.value);
        if (!isNaN(asNumX) && !isNaN(asNumY)) {
            const index = vectors.findIndex((vec) => vec.id === id);
            vectors[index] = {
                ...vectors[index],
                vec: {
                    x: asNumX,
                    y: asNumY,
                },
            };
            if (typeof scheduleShareUpdate === 'function') scheduleShareUpdate();
            // draw();
        }
    };

    cellX.addEventListener('input', readVectorValues);
    cellY.addEventListener('input', readVectorValues);
    addDblClick(cellX, readVectorValues);
    addDblClick(cellY, readVectorValues);

    addDraggingCursor(
        draggingCursor,
        () => {
            const index = vectors.findIndex((vec) => vec.id === id);
            return vectors[index].vec;
        },
        ({ x, y }) => {
            const index = vectors.findIndex((vec) => vec.id === id);
            vectors[index] = {
                ...vectors[index],
                vec: {
                    x: x,
                    y: y,
                },
            };
            // draw();
        },
        ({ x, y }) => {
            cellX.value = x.toFixed(2);
            cellY.value = y.toFixed(2);
            if (typeof scheduleShareUpdate === 'function') scheduleShareUpdate();
        },
    );

    vectorList.append(vectorCard);

    return vectorCard;
};

const resetVectors = () => {
    vectors.forEach((vec) => {
        if (vec.cursor && vec.cursor.remove) {
            vec.cursor.remove();
        }
    });
    vectors = [];
    vectorList.innerHTML = '';
    vecIdTracker = 0;
};

addVector.addEventListener('click', () => {
    createVectorCard();
    if (typeof scheduleShareUpdate === 'function') scheduleShareUpdate();
});

const pointTemplate = document.querySelector('#point-card');
const pointList = document.querySelector('#pointlist');
const addPoint = document.querySelector('#addpoint');

let pointIdTracker = 0;

const createPointCard = (initial = {}) => {
    const pointCard = pointTemplate.content.firstElementChild.cloneNode(true);

    let id;
    if (typeof initial.id === 'number' && initial.id >= 0) {
        id = initial.id;
        pointIdTracker = Math.max(pointIdTracker, id + 1);
    } else {
        id = pointIdTracker++;
    }

    pointCard.dataset.id = id;

    const draggingCursor = document.createElement('div');
    draggingCursor.classList.add('dragging-cursor');
    draggablesContainer.appendChild(draggingCursor);

    const pointDefaults = {
        isActive: true,
        coord: { x: 1, y: 1 },
        color: colorToString(randomColor()),
    };

    const coord = {
        x:
            typeof initial.coord?.x === 'number'
                ? initial.coord.x
                : pointDefaults.coord.x,
        y:
            typeof initial.coord?.y === 'number'
                ? initial.coord.y
                : pointDefaults.coord.y,
    };

    const isActive =
        typeof initial.isActive === 'boolean'
            ? initial.isActive
            : pointDefaults.isActive;
    const color = initial.color || pointDefaults.color;

    points.push({
        id,
        isActive,
        color,
        coord: { x: coord.x, y: coord.y },
        cursor: draggingCursor,
    });

    pointCard.querySelector('.delete').addEventListener('click', () => {
        pointCard.remove();
        draggingCursor.remove();
        const index = points.findIndex((pnt) => pnt.id === id);
        if (index > -1) points.splice(index, 1);
        if (typeof scheduleShareUpdate === 'function') scheduleShareUpdate();
        // draw();
    });

    const checkbox = pointCard.querySelector('.enable');
    checkbox.checked = isActive;

    const setCheckboxStyle = () => {
        checkbox.style.backgroundColor = checkbox.checked
            ? points.find((pnt) => pnt.id === id)?.color || null
            : null;
        if (checkbox.checked) {
            draggingCursor.classList.remove('is-hidden');
        } else {
            draggingCursor.classList.add('is-hidden');
        }
    };

    setCheckboxStyle();

    checkbox.addEventListener('change', () => {
        const index = points.findIndex((pnt) => pnt.id === id);
        points[index] = {
            ...points[index],
            isActive: checkbox.checked,
        };
        setCheckboxStyle();
        if (typeof scheduleShareUpdate === 'function') scheduleShareUpdate();
        // draw();
    });

    const cellX = pointCard.querySelector('.cell.x');
    const cellY = pointCard.querySelector('.cell.y');

    cellX.value = coord.x;
    cellY.value = coord.y;

    const readPointValues = () => {
        const asNumX = parseNumberInput(cellX.value);
        const asNumY = parseNumberInput(cellY.value);
        if (!isNaN(asNumX) && !isNaN(asNumY)) {
            const index = points.findIndex((pnt) => pnt.id === id);
            points[index] = {
                ...points[index],
                coord: {
                    x: asNumX,
                    y: asNumY,
                },
            };
            if (typeof scheduleShareUpdate === 'function') scheduleShareUpdate();
            // draw();
        }
    };

    cellX.addEventListener('input', readPointValues);
    cellY.addEventListener('input', readPointValues);
    addDblClick(cellX, readPointValues);
    addDblClick(cellY, readPointValues);

    addDraggingCursor(
        draggingCursor,
        () => {
            const index = points.findIndex((pnt) => pnt.id === id);
            return points[index].coord;
        },
        ({ x, y }) => {
            const index = points.findIndex((pnt) => pnt.id === id);
            points[index] = {
                ...points[index],
                coord: {
                    x: x,
                    y: y,
                },
            };
            // draw();
        },
        ({ x, y }) => {
            cellX.value = x.toFixed(2);
            cellY.value = y.toFixed(2);
            if (typeof scheduleShareUpdate === 'function') scheduleShareUpdate();
        },
    );

    pointList.append(pointCard);

    return pointCard;
};

const resetPoints = () => {
    points.forEach((pnt) => {
        if (pnt.cursor && pnt.cursor.remove) {
            pnt.cursor.remove();
        }
    });
    points = [];
    pointList.innerHTML = '';
    pointIdTracker = 0;
};

addPoint.addEventListener('click', () => {
    createPointCard();
    if (typeof scheduleShareUpdate === 'function') scheduleShareUpdate();
});

const funcTemplate = document.querySelector('#func-card');
const funcList = document.querySelector('#funclist');
const addFunc = document.querySelector('#addfunc');

let funcIdTracker = 0;

const createFuncCard = (initial = {}) => {
    const funcCard = funcTemplate.content.firstElementChild.cloneNode(true);

    let id;
    if (typeof initial.id === 'number' && initial.id >= 0) {
        id = initial.id;
        funcIdTracker = Math.max(funcIdTracker, id + 1);
    } else {
        id = funcIdTracker++;
    }

    funcCard.dataset.id = id;

    const funcDefaults = {
        isActive: true,
        color: colorToString(randomColor()),
        isRainbow: false,
        func: '',
    };

    const isActive =
        typeof initial.isActive === 'boolean'
            ? initial.isActive
            : funcDefaults.isActive;
    const color = initial.color || funcDefaults.color;
    const isRainbow =
        typeof initial.isRainbow === 'boolean'
            ? initial.isRainbow
            : funcDefaults.isRainbow;
    const funcString =
        typeof initial.func === 'string' ? initial.func : funcDefaults.func;

    let compiledEquation = null;
    if (funcString.trim() !== '') {
        try {
            compiledEquation = math.compile(funcString);
            compiledEquation.evaluate({ x: 0 });
        } catch (e) {
            compiledEquation = null;
        }
    }

    funcs.push({
        id,
        isActive,
        color,
        isRainbow,
        func: funcString,
        mathExp: compiledEquation,
    });

    funcCard.querySelector('.delete').addEventListener('click', () => {
        funcCard.remove();
        const index = funcs.findIndex((func) => func.id === id);
        if (index > -1) funcs.splice(index, 1);
        if (typeof scheduleShareUpdate === 'function') scheduleShareUpdate();
        // draw();
    });

    const checkbox = funcCard.querySelector('.enable');
    checkbox.checked = isActive;

    const setCheckboxStyle = () => {
        checkbox.style.backgroundColor = checkbox.checked
            ? funcs.find((func) => func.id === id)?.color || null
            : null;
    };

    setCheckboxStyle();

    checkbox.addEventListener('change', () => {
        const index = funcs.findIndex((func) => func.id === id);
        funcs[index] = {
            ...funcs[index],
            isActive: checkbox.checked,
        };
        setCheckboxStyle();
        if (typeof scheduleShareUpdate === 'function') scheduleShareUpdate();
        // draw();
    });

    const rainbowCheckbox = funcCard.querySelector('.rainbow-check');
    rainbowCheckbox.checked = isRainbow;

    rainbowCheckbox.addEventListener('change', () => {
        const index = funcs.findIndex((func) => func.id === id);
        funcs[index] = {
            ...funcs[index],
            isRainbow: rainbowCheckbox.checked,
        };
        if (typeof scheduleShareUpdate === 'function') scheduleShareUpdate();
        // draw();
    });

    const funcInput = funcCard.querySelector('.func-eqn');
    funcInput.value = funcString;

    if (funcString.trim() !== '' && !compiledEquation) {
        funcInput.classList.add('has-error');
    }

    funcInput.addEventListener('input', () => {
        try {
            const compiled = funcInput.value.trim()
                ? math.compile(funcInput.value)
                : null;
            if (compiled) {
                compiled.evaluate({ x: 0 });
            }

            funcInput.classList.remove('has-error');

            const index = funcs.findIndex((func) => func.id === id);
            funcs[index] = {
                ...funcs[index],
                func: funcInput.value,
                mathExp: compiled,
            };
            if (typeof scheduleShareUpdate === 'function') scheduleShareUpdate();
            // draw();
        } catch (e) {
            funcInput.classList.add('has-error');
            const index = funcs.findIndex((func) => func.id === id);
            funcs[index] = {
                ...funcs[index],
                func: funcInput.value,
                mathExp: null,
            };
            if (typeof scheduleShareUpdate === 'function') scheduleShareUpdate();
            return;
        }
    });

    funcList.append(funcCard);

    return funcCard;
};

const resetFuncs = () => {
    funcs = [];
    funcList.innerHTML = '';
    funcIdTracker = 0;
};

addFunc.addEventListener('click', () => {
    createFuncCard();
    if (typeof scheduleShareUpdate === 'function') scheduleShareUpdate();
});

const matrixTemplate = document.querySelector('#matrix-card');
const matrixList = document.querySelector('#matrixlist');
const addMatrix = document.querySelector('#addmatrix');

let matrixIdTracker = 0;

const addMatrixCard = (initial = {}) => {
    const matrixCard = matrixTemplate.content.firstElementChild.cloneNode(true);

    let id;
    if (typeof initial.id === 'number' && initial.id >= 0) {
        id = initial.id;
        matrixIdTracker = Math.max(matrixIdTracker, id + 1);
    } else {
        id = matrixIdTracker++;
    }

    matrixCard.dataset.id = id;

    const matrixDefaults = {
        isActive: true,
        i: { x: 1, y: 0 },
        j: { x: 0, y: 1 },
        isDragged: false,
    };

    const baseMatrix = {
        i: {
            x:
                typeof initial.i?.x === 'number'
                    ? initial.i.x
                    : matrixDefaults.i.x,
            y:
                typeof initial.i?.y === 'number'
                    ? initial.i.y
                    : matrixDefaults.i.y,
        },
        j: {
            x:
                typeof initial.j?.x === 'number'
                    ? initial.j.x
                    : matrixDefaults.j.x,
            y:
                typeof initial.j?.y === 'number'
                    ? initial.j.y
                    : matrixDefaults.j.y,
        },
    };

    const isActive =
        typeof initial.isActive === 'boolean'
            ? initial.isActive
            : matrixDefaults.isActive;
    const isDragged =
        typeof initial.isDragged === 'boolean'
            ? initial.isDragged
            : matrixDefaults.isDragged;

    matrices.push({
        id,
        isActive,
        i: { ...baseMatrix.i },
        j: { ...baseMatrix.j },
        isDragged,
    });

    matrixCard.querySelector('.delete').addEventListener('click', () => {
        matrixCard.remove();
        const index = matrices.findIndex((mat) => mat.id === id);
        if (index > -1) matrices.splice(index, 1);
        if (typeof scheduleShareUpdate === 'function') scheduleShareUpdate();
        // draw();
    });

    const checkbox = matrixCard.querySelector('.enable');
    checkbox.checked = isActive;

    checkbox.addEventListener('change', () => {
        const index = matrices.findIndex((mat) => mat.id === id);
        matrices[index] = {
            ...matrices[index],
            isActive: checkbox.checked,
        };
        if (typeof scheduleShareUpdate === 'function') scheduleShareUpdate();
        // draw();
    });

    const iX = matrixCard.querySelector('.cell.i-x');
    const iY = matrixCard.querySelector('.cell.i-y');
    const jX = matrixCard.querySelector('.cell.j-x');
    const jY = matrixCard.querySelector('.cell.j-y');

    iX.value = baseMatrix.i.x;
    iY.value = baseMatrix.i.y;
    jX.value = baseMatrix.j.x;
    jY.value = baseMatrix.j.y;

    const readMatrixValues = () => {
        const asNumIX = parseNumberInput(iX.value);
        const asNumIY = parseNumberInput(iY.value);
        const asNumJX = parseNumberInput(jX.value);
        const asNumJY = parseNumberInput(jY.value);
        if (
            !isNaN(asNumIX) &&
            !isNaN(asNumIY) &&
            !isNaN(asNumJX) &&
            !isNaN(asNumJY)
        ) {
            const index = matrices.findIndex((mat) => mat.id === id);
            matrices[index] = {
                ...matrices[index],
                i: { x: asNumIX, y: asNumIY },
                j: { x: asNumJX, y: asNumJY },
                // once a user modifies it, we have to make a new one for dragging
                isDragged: false,
            };
            if (typeof scheduleShareUpdate === 'function') scheduleShareUpdate();
            // draw();
        }
    };

    iX.addEventListener('input', readMatrixValues);
    iY.addEventListener('input', readMatrixValues);
    jX.addEventListener('input', readMatrixValues);
    jY.addEventListener('input', readMatrixValues);
    addDblClick(iX, readMatrixValues);
    addDblClick(iY, readMatrixValues);
    addDblClick(jX, readMatrixValues);
    addDblClick(jY, readMatrixValues);

    matrixList.append(matrixCard);

    // returned for dragging basis vectors
    return matrixCard;
};

addMatrix.addEventListener('click', () => {
    addMatrixCard();
    if (typeof scheduleShareUpdate === 'function') scheduleShareUpdate();
});

// basis vector dragging
basisDraggingCursorI = document.createElement('div');
basisDraggingCursorI.classList.add('dragging-cursor');
draggablesContainer.appendChild(basisDraggingCursorI);

basisDraggingCursorJ = document.createElement('div');
basisDraggingCursorJ.classList.add('dragging-cursor');
draggablesContainer.appendChild(basisDraggingCursorJ);

let currentDraggingId = null;
let currentDraggingCells = {
    iX: null,
    iY: null,
    jX: null,
    jY: null,
};

const resetMatrices = () => {
    matrices.forEach((mat) => {
        const card = document.querySelector(
            `.matrix-input[data-id='${mat.id}']`,
        );
        if (card) {
            card.remove();
        }
    });
    matrices = [];
    matrixList.innerHTML = '';
    matrixIdTracker = 0;
    currentDraggingId = null;
    currentDraggingCells = {
        iX: null,
        iY: null,
        jX: null,
        jY: null,
    };
};

addDraggingCursor(
    basisDraggingCursorI,
    () => {
        const index = matrices.findIndex((mat) => mat.id === currentDraggingId);
        if (
            currentDraggingId === null ||
            index < 0 ||
            !matrices[index].isDragged ||
            !matrices[index].isActive
        ) {
            matrices.forEach((mat, index) => {
                matrices[index].isActive = false;
                document.querySelector(
                    `.matrix-input[data-id='${mat.id}'] > .enable`,
                ).checked = false;
            });

            const matrixCard = addMatrixCard();
            const draggingMatrix = matrices[matrices.length - 1];
            draggingMatrix.i = liveMatrix.matrix.i;
            draggingMatrix.j = liveMatrix.matrix.j;
            draggingMatrix.isDragged = true;
            currentDraggingId = draggingMatrix.id;
            currentDraggingCells = {
                iX: matrixCard.querySelector('.cell.i-x'),
                iY: matrixCard.querySelector('.cell.i-y'),
                jX: matrixCard.querySelector('.cell.j-x'),
                jY: matrixCard.querySelector('.cell.j-y'),
            };
            currentDraggingCells.iX.value = draggingMatrix.i.x.toFixed(2);
            currentDraggingCells.iY.value = draggingMatrix.i.y.toFixed(2);
            currentDraggingCells.jX.value = draggingMatrix.j.x.toFixed(2);
            currentDraggingCells.jY.value = draggingMatrix.j.y.toFixed(2);
        }
        return liveMatrix.matrix.i;
    },
    ({ x, y }) => {
        const index = matrices.findIndex((mat) => mat.id === currentDraggingId);
        matrices[index] = {
            ...matrices[index],
            i: {
                x: x,
                y: y,
            },
        };
    },
    ({ x, y }) => {
        currentDraggingCells.iX.value = x.toFixed(2);
        currentDraggingCells.iY.value = y.toFixed(2);
        if (typeof scheduleShareUpdate === 'function') scheduleShareUpdate();
    },
    true,
);
addDraggingCursor(
    basisDraggingCursorJ,
    () => {
        const index = matrices.findIndex((mat) => mat.id === currentDraggingId);
        if (
            currentDraggingId === null ||
            index < 0 ||
            !matrices[index].isDragged ||
            !matrices[index].isActive
        ) {
            matrices.forEach((mat, index) => {
                matrices[index].isActive = false;
                document.querySelector(
                    `.matrix-input[data-id='${mat.id}'] > .enable`,
                ).checked = false;
            });

            const matrixCard = addMatrixCard();
            const draggingMatrix = matrices[matrices.length - 1];
            draggingMatrix.isDragged = true;
            draggingMatrix.i = liveMatrix.matrix.i;
            draggingMatrix.j = liveMatrix.matrix.j;
            currentDraggingId = draggingMatrix.id;
            currentDraggingCells = {
                iX: matrixCard.querySelector('.cell.i-x'),
                iY: matrixCard.querySelector('.cell.i-y'),
                jX: matrixCard.querySelector('.cell.j-x'),
                jY: matrixCard.querySelector('.cell.j-y'),
            };
            currentDraggingCells.iX.value = draggingMatrix.i.x.toFixed(2);
            currentDraggingCells.iY.value = draggingMatrix.i.y.toFixed(2);
            currentDraggingCells.jX.value = draggingMatrix.j.x.toFixed(2);
            currentDraggingCells.jY.value = draggingMatrix.j.y.toFixed(2);
        }
        return liveMatrix.matrix.j;
    },
    ({ x, y }) => {
        const index = matrices.findIndex((mat) => mat.id === currentDraggingId);
        matrices[index] = {
            ...matrices[index],
            j: {
                x: x,
                y: y,
            },
        };
    },
    ({ x, y }) => {
        currentDraggingCells.jX.value = x.toFixed(2);
        currentDraggingCells.jY.value = y.toFixed(2);
        if (typeof scheduleShareUpdate === 'function') scheduleShareUpdate();
    },
    true,
);

const addDblClick = (input, callback) => {
    const defaultValue = input.value;

    input.addEventListener('dblclick', () => {
        input.value = defaultValue;
        callback();
    });
};

const makeDraggable = (input, callback, elToStopDrag) => {
    const mouseNumStartPosition = {};
    let numStart;

    function mousedownNum(e) {
        mouseNumStartPosition.y = e.pageY;
        numStart = parseFloat(input.value);
        numStart = isNaN(numStart) ? 0 : numStart;

        input.classList.add('is-dragging');
        if (elToStopDrag) elToStopDrag.draggable = false;

        // add listeners for mousemove, mouseup
        window.addEventListener('mousemove', mousemoveNum);
        window.addEventListener('mouseup', mouseupNum);
    }

    let throttlePause;
    function mousemoveNum(e) {
        const diff = (mouseNumStartPosition.y - e.pageY) / 20;
        const newLeft = numStart + diff;
        input.value = newLeft;

        if (throttlePause) return;
        throttlePause = true;

        setTimeout(() => {
            callback();

            throttlePause = false;
        }, 80);
    }

    function mouseupNum(e) {
        input.classList.remove('is-dragging');
        if (elToStopDrag) elToStopDrag.draggable = true;
        window.removeEventListener('mousemove', mousemoveNum);
        window.removeEventListener('mouseup', mouseupNum);
    }

    input.addEventListener('mousedown', mousedownNum);
};

let panStartingPoint = { x: 0, y: 0 };
let panMouseStartPosition = {
    x: 0,
    y: 0,
};
let panStartScaleFactor = 1;

function panMousedown(e) {
    e.preventDefault();

    panStartingPoint = panCenter;
    panMouseStartPosition = {
        x: e.pageX,
        y: e.pageY,
    };
    panStartScaleFactor = getScaleFactor() / window.devicePixelRatio;

    // add listeners for mousemove, mouseup
    draggablesContainer.addEventListener('pointermove', panMousemove);
    window.addEventListener('pointerup', panMouseup);
}

function panMousemove(e) {
    e.preventDefault();

    const diffX = (panMouseStartPosition.x - e.pageX) / panStartScaleFactor;
    const diffY = (panMouseStartPosition.y - e.pageY) / panStartScaleFactor;

    panCenter = {
        x: panStartingPoint.x - diffX,
        y: panStartingPoint.y + diffY,
    };
}

function panMouseup(e) {
    e.preventDefault();

    // remove listeners for mousemove, mouseup
    draggablesContainer.removeEventListener('pointermove', panMousemove);
    window.removeEventListener('pointerup', panMouseup);

    if (typeof scheduleShareUpdate === 'function') scheduleShareUpdate();
}

draggablesContainer.addEventListener('pointerdown', panMousedown);

const buttonStrength = 1.2;
document.querySelector('#zoomout').addEventListener('click', () => {
    zoomFactor = Math.min(50, zoomFactor * buttonStrength);
    // init();
    // draw();
    if (typeof scheduleShareUpdate === 'function') scheduleShareUpdate();
});

document.querySelector('#zoomin').addEventListener('click', () => {
    zoomFactor = Math.max(0.3, zoomFactor / buttonStrength);
    // init();
    // if (zoomFactor > 0.1) {
    //     // draw();
    // }
    if (typeof scheduleShareUpdate === 'function') scheduleShareUpdate();
});

document.querySelector('#zoomreset').addEventListener('click', () => {
    zoomFactor = 1;
    panCenter = {
        x: 0,
        y: 0,
    };
    if (typeof scheduleShareUpdate === 'function') scheduleShareUpdate();
});

let zoomThrottlePause = false;
draggablesContainer.addEventListener('wheel', (e) => {
    e.preventDefault();

    if (zoomThrottlePause) return;
    zoomThrottlePause = true;

    const scaleFactor = getScaleFactor();
    const mouseX = e.offsetX * window.devicePixelRatio;
    const mouseY = e.offsetY * window.devicePixelRatio;
    const pointAtMouse = unpoint({ mouseX, mouseY });

    zoomFactor = Math.min(Math.max(0.3, zoomFactor + e.deltaY * 0.003), 50);

    const resultingPoint = point({
        x: pointAtMouse.x,
        y: pointAtMouse.y,
    });

    const diffX = (resultingPoint.x - mouseX) / scaleFactor;
    const diffY = (-1 * (resultingPoint.y - mouseY)) / scaleFactor;

    panCenter.x -= diffX;
    panCenter.y -= diffY;

    zoomThrottlePause = false;

    if (typeof scheduleShareUpdate === 'function') scheduleShareUpdate();
});

function addDraggingCursor(
    cursor,
    // getCurrentPoint MUST only be called once on mousedown, it can have side effects
    getCurrentPoint,
    changeCallback,
    // expensive callback is throttled (use for changing DOM, etc)
    expensiveChangeCallback,
    // useRawPoints disables translating (used for basis vectors)
    useRawPoints,
) {
    let startingPoint = { x: 0, y: 0 };
    let mouseStartPosition = {
        x: 0,
        y: 0,
    };
    let scaleFactor = 1;

    function mousedown(e) {
        e.preventDefault();
        e.stopPropagation();

        isDragging = true;

        startingPoint = useRawPoints
            ? getCurrentPoint()
            : trans(getCurrentPoint());
        mouseStartPosition = {
            x: e.pageX,
            y: e.pageY,
        };
        scaleFactor = getScaleFactor() / window.devicePixelRatio;

        cursor.classList.add('is-dragging');

        // add listeners for mousemove, mouseup
        window.addEventListener('pointermove', mousemove);
        window.addEventListener('pointerup', mouseup);
    }

    let throttlePause;
    function mousemove(e) {
        e.preventDefault();
        e.stopPropagation();

        const diffX = (mouseStartPosition.x - e.pageX) / scaleFactor;
        const diffY = (mouseStartPosition.y - e.pageY) / scaleFactor;
        const newPoint = {
            x: startingPoint.x - diffX,
            y: startingPoint.y + diffY,
        };

        const unTrans = useRawPoints ? newPoint : inverseTrans(newPoint);

        changeCallback(unTrans);

        if (throttlePause) return;
        throttlePause = true;

        setTimeout(() => {
            expensiveChangeCallback(unTrans);

            throttlePause = false;
        }, 100);
    }

    function mouseup(e) {
        e.preventDefault();
        e.stopPropagation();

        isDragging = false;

        // remove listeners for mousemove, mouseup
        cursor.classList.remove('is-dragging');
        window.removeEventListener('pointermove', mousemove);
        window.removeEventListener('pointerup', mouseup);
    }

    cursor.addEventListener('pointerdown', mousedown);
}
