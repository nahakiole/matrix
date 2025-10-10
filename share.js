(function () {
    const LEGACY_STATE_PARAM = 'state';
    const SHARE_VERSION = 2;
    const SHARE_DEBOUNCE_MS = 200;

    const defaultOptions = {
        drawRainbows: false,
        drawBasisVecs: true,
        drawGridLines: true,
        drawVectorLabels: false,
        animSpeed: 1,
        gridSize: 0,
    };

    const defaultView = {
        zoomFactor: 1,
        panCenter: { x: 0, y: 0 },
    };

    const shareInput = document.querySelector('#share-url');
    const shareCopyButton = document.querySelector('#share-copy');
    const shareStatus = document.querySelector('#share-status');

    let isApplyingSharedState = false;
    let shareUpdateTimeout = null;
    let statusResetTimeout = null;
    let latestShareUrl = window.location.href;

    function setStatus(message, type = 'info') {
        if (!shareStatus) return;

        shareStatus.textContent = message;
        shareStatus.classList.remove('success', 'error');

        if (type === 'success' || type === 'error') {
            shareStatus.classList.add(type);
        }

        if (statusResetTimeout) {
            window.clearTimeout(statusResetTimeout);
            statusResetTimeout = null;
        }

        if (message) {
            statusResetTimeout = window.setTimeout(() => {
                shareStatus.textContent = '';
                shareStatus.classList.remove('success', 'error');
                statusResetTimeout = null;
            }, 3000);
        }
    }

    function boolToFlag(value) {
        return value ? 'on' : 'off';
    }

    function flagToBool(value) {
        const normalized = String(value || '').toLowerCase();
        return (
            normalized === 'on' ||
            normalized === 'true' ||
            normalized === '1' ||
            normalized === 'yes'
        );
    }

    function sanitizeNumberField(value) {
        if (value === null || value === undefined) return '';
        return String(value)
            .trim()
            .replace(/\s+/g, '')
            .replace(/[|&?]/g, '/');
    }

    function sanitizeEquationField(value) {
        if (typeof value !== 'string') return '';
        return value
            .trim()
            .replace(/\s+/g, '_')
            .replace(/[|&?]/g, '_');
    }

    function desanitizeEquationField(value) {
        if (typeof value !== 'string') return '';
        return value.replace(/_/g, ' ');
    }

    function rgbStringToHex(color) {
        if (typeof color !== 'string') return '';
        const match = color.match(/rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/i);
        if (!match) return '';
        const toHex = (num) => {
            const clamped = Math.max(0, Math.min(255, parseInt(num, 10) || 0));
            return clamped.toString(16).padStart(2, '0');
        };
        return `${toHex(match[1])}${toHex(match[2])}${toHex(match[3])}`;
    }

    function hexToRgbString(hex) {
        if (typeof hex !== 'string') return null;
        const normalized = hex.trim().toLowerCase();
        const valid = normalized.match(/^[0-9a-f]{6}$/);
        if (!valid) return null;
        const r = parseInt(normalized.slice(0, 2), 16);
        const g = parseInt(normalized.slice(2, 4), 16);
        const b = parseInt(normalized.slice(4, 6), 16);
        return `rgb(${r}, ${g}, ${b})`;
    }

    function readCellValue(card, selector, fallback) {
        if (card) {
            const input = card.querySelector(selector);
            if (input && typeof input.value === 'string') {
                const trimmed = input.value.trim();
                if (trimmed !== '') {
                    return trimmed;
                }
            }
        }
        return sanitizeNumberField(fallback);
    }

    function collectShareState() {
        const matricesState = [];
        if (Array.isArray(matrices)) {
            matrices.forEach((mat) => {
                if (!mat) return;
                const card = document.querySelector(
                    `.matrix-input[data-id='${mat.id}']`,
                );
                matricesState.push({
                    isActive: !!mat.isActive,
                    isDragged: !!mat.isDragged,
                    i: {
                        x: readCellValue(card, '.cell.i-x', mat?.i?.x ?? 1),
                        y: readCellValue(card, '.cell.i-y', mat?.i?.y ?? 0),
                    },
                    j: {
                        x: readCellValue(card, '.cell.j-x', mat?.j?.x ?? 0),
                        y: readCellValue(card, '.cell.j-y', mat?.j?.y ?? 1),
                    },
                });
            });
        }

        const vectorsState = [];
        if (Array.isArray(vectors)) {
            vectors.forEach((vec) => {
                if (!vec) return;
                const card = document.querySelector(
                    `.vector-input[data-id='${vec.id}']`,
                );
                vectorsState.push({
                    isActive: !!vec.isActive,
                    color: typeof vec.color === 'string' ? vec.color : undefined,
                    vec: {
                        x: readCellValue(card, '.cell.x', vec?.vec?.x ?? 1),
                        y: readCellValue(card, '.cell.y', vec?.vec?.y ?? 1),
                    },
                });
            });
        }

        const pointsState = [];
        if (Array.isArray(points)) {
            points.forEach((pnt) => {
                if (!pnt) return;
                const card = document.querySelector(
                    `.point-input[data-id='${pnt.id}']`,
                );
                pointsState.push({
                    isActive: !!pnt.isActive,
                    color: typeof pnt.color === 'string' ? pnt.color : undefined,
                    coord: {
                        x: readCellValue(card, '.cell.x', pnt?.coord?.x ?? 1),
                        y: readCellValue(card, '.cell.y', pnt?.coord?.y ?? 1),
                    },
                });
            });
        }

        const funcsState = [];
        if (Array.isArray(funcs)) {
            funcs.forEach((func) => {
                if (!func) return;
                funcsState.push({
                    isActive: !!func.isActive,
                    isRainbow: !!func.isRainbow,
                    color: typeof func.color === 'string' ? func.color : undefined,
                    func: typeof func.func === 'string' ? func.func : '',
                });
            });
        }

        const safeAnimSpeed = Math.max(
            0,
            Math.min(ANIM_SPEEDS.length - 1, parseInt(animSpeed, 10) || 0),
        );
        const safeGridSize = Math.max(
            0,
            Math.min(GRID_SIZES.length - 1, parseInt(gridSize, 10) || 0),
        );

        return {
            version: SHARE_VERSION,
            options: {
                drawRainbows: !!drawRainbows,
                drawBasisVecs: !!drawBasisVecs,
                drawGridLines: !!drawGridLines,
                drawVectorLabels: !!drawVectorLabels,
                animSpeed: safeAnimSpeed,
                gridSize: safeGridSize,
            },
            view: {
                zoomFactor: Number(zoomFactor) || defaultView.zoomFactor,
                panCenter: {
                    x: Number(panCenter?.x) || defaultView.panCenter.x,
                    y: Number(panCenter?.y) || defaultView.panCenter.y,
                },
            },
            matrices: matricesState,
            vectors: vectorsState,
            points: pointsState,
            funcs: funcsState,
        };
    }

    function buildShareQuery(state) {
        const parts = [];
        parts.push(`ver=${SHARE_VERSION}`);
        parts.push(`rainbow=${boolToFlag(state.options.drawRainbows)}`);
        parts.push(`basis=${boolToFlag(state.options.drawBasisVecs)}`);
        parts.push(`grid=${boolToFlag(state.options.drawGridLines)}`);
        parts.push(`labels=${boolToFlag(state.options.drawVectorLabels)}`);
        parts.push(`speed=${state.options.animSpeed}`);
        parts.push(`size=${state.options.gridSize}`);

        const zoomField = sanitizeNumberField(state.view.zoomFactor);
        parts.push(`zoom=${zoomField}`);
        const panX = sanitizeNumberField(state.view.panCenter.x);
        const panY = sanitizeNumberField(state.view.panCenter.y);
        parts.push(`pan=${panX},${panY}`);

        state.matrices.forEach((mat) => {
            const fields = [
                boolToFlag(mat.isActive),
                boolToFlag(mat.isDragged),
                sanitizeNumberField(mat.i.x),
                sanitizeNumberField(mat.i.y),
                sanitizeNumberField(mat.j.x),
                sanitizeNumberField(mat.j.y),
            ];
            parts.push(`m[]=${fields.join('|')}`);
        });

        state.vectors.forEach((vec) => {
            const colorHex = rgbStringToHex(vec.color) || '';
            const fields = [
                boolToFlag(vec.isActive),
                sanitizeNumberField(vec.vec.x),
                sanitizeNumberField(vec.vec.y),
                colorHex,
            ];
            parts.push(`vec[]=${fields.join('|')}`);
        });

        state.points.forEach((pnt) => {
            const colorHex = rgbStringToHex(pnt.color) || '';
            const fields = [
                boolToFlag(pnt.isActive),
                sanitizeNumberField(pnt.coord.x),
                sanitizeNumberField(pnt.coord.y),
                colorHex,
            ];
            parts.push(`pt[]=${fields.join('|')}`);
        });

        state.funcs.forEach((func) => {
            const colorHex = rgbStringToHex(func.color) || '';
            const fields = [
                boolToFlag(func.isActive),
                boolToFlag(func.isRainbow),
                colorHex,
                sanitizeEquationField(func.func),
            ];
            parts.push(`fn[]=${fields.join('|')}`);
        });

        return parts.join('&');
    }

    function updateShareInput(value) {
        if (!shareInput) return;
        shareInput.value = value;
    }

    function updateShareUrlNow() {
        const state = collectShareState();
        const query = buildShareQuery(state);
        const base = `${window.location.origin}${window.location.pathname}`;
        const hash = window.location.hash || '';
        const full = query ? `${base}?${query}${hash}` : `${base}${hash}`;

        if (!isApplyingSharedState && typeof history.replaceState === 'function') {
            history.replaceState(null, '', full);
        }

        latestShareUrl = full;
        updateShareInput(full);
    }

    function scheduleShareUpdateInternal() {
        if (isApplyingSharedState) return;
        if (shareUpdateTimeout) {
            window.clearTimeout(shareUpdateTimeout);
        }
        shareUpdateTimeout = window.setTimeout(() => {
            shareUpdateTimeout = null;
            updateShareUrlNow();
        }, SHARE_DEBOUNCE_MS);
    }

    window.scheduleShareUpdate = scheduleShareUpdateInternal;

    function updateOptionButtons() {
        const rainbowButton = document.querySelector('#rainbow');
        if (rainbowButton) {
            rainbowButton.innerText = `${drawRainbows ? 'Turn off' : 'Turn on'} rainbow points`;
        }

        const basisButton = document.querySelector('#basisvecs');
        if (basisButton) {
            basisButton.innerText = `${drawBasisVecs ? 'Turn off' : 'Turn on'} î and ĵ`;
        }

        if (basisDraggingCursorI && basisDraggingCursorJ) {
            if (drawBasisVecs) {
                basisDraggingCursorI.classList.remove('is-hidden');
                basisDraggingCursorJ.classList.remove('is-hidden');
            } else {
                basisDraggingCursorI.classList.add('is-hidden');
                basisDraggingCursorJ.classList.add('is-hidden');
            }
        }

        const gridButton = document.querySelector('#grid');
        if (gridButton) {
            gridButton.innerText = `${drawGridLines ? 'Turn off' : 'Turn on'} grid`;
        }

        const labelsButton = document.querySelector('#veclabels');
        if (labelsButton) {
            labelsButton.innerText = `${drawVectorLabels ? 'Turn off' : 'Turn on'} object labels`;
        }

        const speedButton = document.querySelector('#speed');
        if (speedButton) {
            speedButton.innerText = `Change animation speed (${ANIM_SPEEDS[animSpeed].name})`;
        }

        const sizeButton = document.querySelector('#size');
        if (sizeButton) {
            sizeButton.innerText = `Change grid size (${GRID_SIZES[gridSize].name})`;
        }
    }

    function applyMatrixStrings(card, matState) {
        if (!card || !matState) return;
        const { i, j } = matState;
        const iX = card.querySelector('.cell.i-x');
        const iY = card.querySelector('.cell.i-y');
        const jX = card.querySelector('.cell.j-x');
        const jY = card.querySelector('.cell.j-y');
        if (iX && typeof i?.x === 'string') iX.value = i.x;
        if (iY && typeof i?.y === 'string') iY.value = i.y;
        if (jX && typeof j?.x === 'string') jX.value = j.x;
        if (jY && typeof j?.y === 'string') jY.value = j.y;
    }

    function applyVectorStrings(card, vecState) {
        if (!card || !vecState) return;
        const xInput = card.querySelector('.cell.x');
        const yInput = card.querySelector('.cell.y');
        if (xInput && typeof vecState?.vec?.x === 'string') {
            xInput.value = vecState.vec.x;
        }
        if (yInput && typeof vecState?.vec?.y === 'string') {
            yInput.value = vecState.vec.y;
        }
    }

    function applyPointStrings(card, pointState) {
        if (!card || !pointState) return;
        const xInput = card.querySelector('.cell.x');
        const yInput = card.querySelector('.cell.y');
        if (xInput && typeof pointState?.coord?.x === 'string') {
            xInput.value = pointState.coord.x;
        }
        if (yInput && typeof pointState?.coord?.y === 'string') {
            yInput.value = pointState.coord.y;
        }
    }

    function applyFuncStrings(card, funcState) {
        if (!card || !funcState) return;
        const funcInput = card.querySelector('.func-eqn');
        if (funcInput && typeof funcState.func === 'string') {
            funcInput.value = funcState.func;
        }
    }

    function applySharedState(state) {
        if (!state || typeof state !== 'object') return;

        isApplyingSharedState = true;
        try {
            const options = {
                ...defaultOptions,
                ...(typeof state.options === 'object' ? state.options : {}),
            };
            drawRainbows = !!options.drawRainbows;
            drawBasisVecs = !!options.drawBasisVecs;
            drawGridLines = !!options.drawGridLines;
            drawVectorLabels = !!options.drawVectorLabels;
            animSpeed = Math.max(
                0,
                Math.min(ANIM_SPEEDS.length - 1, parseInt(options.animSpeed, 10) || 0),
            );
            gridSize = Math.max(
                0,
                Math.min(GRID_SIZES.length - 1, parseInt(options.gridSize, 10) || 0),
            );

            const view = typeof state.view === 'object' ? state.view : {};
            const pan = typeof view.panCenter === 'object' ? view.panCenter : {};
            zoomFactor = Math.min(
                50,
                Math.max(0.3, Number(view.zoomFactor) || defaultView.zoomFactor),
            );
            panCenter = {
                x: Number(pan.x) || defaultView.panCenter.x,
                y: Number(pan.y) || defaultView.panCenter.y,
            };

            if (typeof resetMatrices === 'function') {
                resetMatrices();
            }
            if (Array.isArray(state.matrices) && typeof addMatrixCard === 'function') {
                state.matrices.forEach((mat) => {
                    const initial = {
                        isActive: !!mat.isActive,
                        isDragged: !!mat.isDragged,
                        i: {
                            x: safeDefault(parseNumberInput(mat?.i?.x), 1),
                            y: safeDefault(parseNumberInput(mat?.i?.y), 0),
                        },
                        j: {
                            x: safeDefault(parseNumberInput(mat?.j?.x), 0),
                            y: safeDefault(parseNumberInput(mat?.j?.y), 1),
                        },
                    };
                    const card = addMatrixCard(initial);
                    applyMatrixStrings(card, mat);
                });
            }

            if (typeof resetVectors === 'function') {
                resetVectors();
            }
            if (Array.isArray(state.vectors) && typeof createVectorCard === 'function') {
                state.vectors.forEach((vec) => {
                    const initial = {
                        isActive: !!vec.isActive,
                        color: vec.color,
                        vec: {
                            x: safeDefault(parseNumberInput(vec?.vec?.x), 1),
                            y: safeDefault(parseNumberInput(vec?.vec?.y), 1),
                        },
                    };
                    const card = createVectorCard(initial);
                    applyVectorStrings(card, vec);
                });
            }

            if (typeof resetPoints === 'function') {
                resetPoints();
            }
            if (Array.isArray(state.points) && typeof createPointCard === 'function') {
                state.points.forEach((pnt) => {
                    const initial = {
                        isActive: !!pnt.isActive,
                        color: pnt.color,
                        coord: {
                            x: safeDefault(parseNumberInput(pnt?.coord?.x), 1),
                            y: safeDefault(parseNumberInput(pnt?.coord?.y), 1),
                        },
                    };
                    const card = createPointCard(initial);
                    applyPointStrings(card, pnt);
                });
            }

            if (typeof resetFuncs === 'function') {
                resetFuncs();
            }
            if (Array.isArray(state.funcs) && typeof createFuncCard === 'function') {
                state.funcs.forEach((func) => {
                    const initial = {
                        isActive: !!func.isActive,
                        isRainbow: !!func.isRainbow,
                        color: func.color,
                        func: desanitizeEquationField(func.func),
                    };
                    const card = createFuncCard(initial);
                    applyFuncStrings(card, {
                        func: desanitizeEquationField(func.func),
                    });
                });
            }
        } finally {
            isApplyingSharedState = false;
        }

        updateOptionButtons();
        updateShareUrlNow();
    }

    function safeDefault(value, fallback) {
        const num = Number(value);
        return Number.isFinite(num) ? num : fallback;
    }

    function parseCustomQuery(search) {
        if (!search) return null;
        const params = search.split('&').filter(Boolean);
        if (params.length === 0) return null;

        const state = {
            version: SHARE_VERSION,
            options: { ...defaultOptions },
            view: {
                zoomFactor: defaultView.zoomFactor,
                panCenter: { ...defaultView.panCenter },
            },
            matrices: [],
            vectors: [],
            points: [],
            funcs: [],
        };

        let recognized = false;

        params.forEach((pair) => {
            const [rawKey, rawValue = ''] = pair.split('=');
            const key = rawKey;
            const value = rawValue;

            switch (key) {
                case 'rainbow':
                    state.options.drawRainbows = flagToBool(value);
                    recognized = true;
                    break;
                case 'basis':
                    state.options.drawBasisVecs = flagToBool(value);
                    recognized = true;
                    break;
                case 'grid':
                    state.options.drawGridLines = flagToBool(value);
                    recognized = true;
                    break;
                case 'labels':
                    state.options.drawVectorLabels = flagToBool(value);
                    recognized = true;
                    break;
                case 'speed':
                    state.options.animSpeed = parseInt(value, 10) || defaultOptions.animSpeed;
                    recognized = true;
                    break;
                case 'size':
                    state.options.gridSize = parseInt(value, 10) || defaultOptions.gridSize;
                    recognized = true;
                    break;
                case 'zoom':
                    state.view.zoomFactor = Number(value) || defaultView.zoomFactor;
                    recognized = true;
                    break;
                case 'pan': {
                    const parts = value.split(',');
                    if (parts.length >= 2) {
                        state.view.panCenter = {
                            x: Number(parseNumberInput(parts[0])) || defaultView.panCenter.x,
                            y: Number(parseNumberInput(parts[1])) || defaultView.panCenter.y,
                        };
                        recognized = true;
                    }
                    break;
                }
                case 'ver':
                    recognized = true;
                    break;
                case 'm[]':
                case 'm': {
                    const fields = value.split('|');
                    if (fields.length >= 6) {
                        state.matrices.push({
                            isActive: flagToBool(fields[0]),
                            isDragged: flagToBool(fields[1]),
                            i: { x: fields[2], y: fields[3] },
                            j: { x: fields[4], y: fields[5] },
                        });
                        recognized = true;
                    }
                    break;
                }
                case 'vec[]':
                case 'vec': {
                    const fields = value.split('|');
                    if (fields.length >= 4) {
                        const color = hexToRgbString(fields[3]) || undefined;
                        state.vectors.push({
                            isActive: flagToBool(fields[0]),
                            color,
                            vec: { x: fields[1], y: fields[2] },
                        });
                        recognized = true;
                    }
                    break;
                }
                case 'pt[]':
                case 'pt': {
                    const fields = value.split('|');
                    if (fields.length >= 4) {
                        const color = hexToRgbString(fields[3]) || undefined;
                        state.points.push({
                            isActive: flagToBool(fields[0]),
                            color,
                            coord: { x: fields[1], y: fields[2] },
                        });
                        recognized = true;
                    }
                    break;
                }
                case 'fn[]':
                case 'fn': {
                    const fields = value.split('|');
                    if (fields.length >= 4) {
                        const color = hexToRgbString(fields[2]) || undefined;
                        state.funcs.push({
                            isActive: flagToBool(fields[0]),
                            isRainbow: flagToBool(fields[1]),
                            color,
                            func: desanitizeEquationField(fields[3] || ''),
                        });
                        recognized = true;
                    }
                    break;
                }
                default:
                    break;
            }
        });

        return recognized ? state : null;
    }

    function decodeLegacyJson(value) {
        try {
            return JSON.parse(value);
        } catch (error) {
            return null;
        }
    }

    function decodeLegacyBase64(value) {
        try {
            const binary = atob(value);
            const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
            const json = new TextDecoder().decode(bytes);
            return JSON.parse(json);
        } catch (error) {
            return null;
        }
    }

    function loadStateFromUrl() {
        const search = window.location.search.slice(1);
        if (!search) return;

        if (search.includes(`${LEGACY_STATE_PARAM}=`)) {
            const params = new URLSearchParams(window.location.search);
            const raw = params.get(LEGACY_STATE_PARAM);
            if (!raw) return;

            const legacyJson = decodeLegacyJson(raw) || decodeLegacyBase64(raw);
            if (legacyJson) {
                applySharedState(legacyJson);
                setStatus('Loaded a legacy share link. Saving will upgrade it.', 'info');
            } else {
                console.error('Failed to load legacy shared state');
                setStatus('Could not load shared setup from the URL.', 'error');
            }
            return;
        }

        const state = parseCustomQuery(search);
        if (state) {
            applySharedState(state);
        }
    }

    async function copyShareLink() {
        updateShareUrlNow();
        const shareValue = latestShareUrl || window.location.href;

        try {
            if (
                navigator.clipboard &&
                typeof navigator.clipboard.writeText === 'function'
            ) {
                await navigator.clipboard.writeText(shareValue);
            } else if (shareInput) {
                shareInput.focus();
                shareInput.select();
                const successful = document.execCommand('copy');
                if (!successful) {
                    throw new Error('execCommand failed');
                }
            } else {
                throw new Error('No way to copy share link');
            }
            setStatus('Link copied to clipboard.', 'success');
        } catch (error) {
            console.error('Copy failed', error);
            setStatus('Copy failed. Select the link and copy manually.', 'error');
        }
    }

    if (shareInput) {
        shareInput.addEventListener('focus', () => {
            shareInput.select();
        });
        shareInput.addEventListener('mouseup', (event) => {
            event.preventDefault();
        });
    }

    if (shareCopyButton) {
        shareCopyButton.addEventListener('click', () => {
            copyShareLink();
        });
    }

    loadStateFromUrl();
    updateOptionButtons();
    updateShareUrlNow();
})();
