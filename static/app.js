const labelSelect = document.getElementById('sel-label');
const wrapper = document.getElementById('wrapper');
const form = document.getElementById('form');
const button = document.getElementById('btn');

/**
 * Load a template
 */
if (labelSelect) {
    labelSelect.onchange = function loadTemplate() {
        fetch('/static/labels/' + labelSelect.value + '.html')
            .then(function (response) {
                if (response.ok) {
                    return response.text();
                }
                throw new Error('Network response was not ok.');
            })
            .then(function (text) {
                wrapper.innerHTML = text;

                if (wrapper.firstChild.hasAttribute('data-scale')) {
                    wrapper.style.transform = 'scale(' + wrapper.firstChild.getAttribute('data-scale') + ')';
                } else {
                    wrapper.style.transform = '';
                }

                buildForm();
                buildQR();
            })
            .catch(function (error) {
                console.error('oops, something went wrong!', error);
                alert(error)
            })
        ;
    };
    labelSelect.onchange(); // first load
}

/**
 * Create the input form for the loaded template
 */
function buildForm() {
    const inputs = wrapper.querySelectorAll('.input');
    form.innerHTML = '';

    for (let input of inputs) {

        let inp = document.createElement('textarea');

        if (input.dataset.value) {
            inp.placeholder = input.dataset.value;
            inp.oninput = function () {
                input.dataset.value = inp.value;
                if (input.qrcode) {
                    input.qrcode.makeCode(inp.value);
                    //input.innerText = form.getElementsByTagName("textarea")[1].value;
                    inputs[1].innerText = form.getElementsByTagName("textarea")[0].value;
                }
                //input.innerText = form.getElementsByTagName("textarea")[1].value;
            };
        } else {
            inp.placeholder = input.innerText;
            inp.oninput = function () {
                input.innerText = inp.value;
            };
            inp.setAttribute("disabled","disabled");
        }
        form.appendChild(inp);
    }

    let inp = document.createElement("INPUT");
    inp.setAttribute("type", "number");
    inp.placeholder = "num copies";
    form.appendChild(inp);
}

/**
 * Attach QR code handling
 */
function buildQR() {
    const inputs = wrapper.querySelectorAll('.qrcode');

    for (let input of inputs) {
        input.qrcode = new QRCode(input, {width: input.offsetWidth, height: input.offsetWidth});
        input.qrcode.makeCode(input.dataset.value);
    }
}

/**
 * Return the currently used label size
 *
 * @return {string}
 */
function getSize() {
    if(labelSelect) {
        return labelSelect.value.split('_')[0];
    } else {
        return FIXEDSIZE; // custom interfaces can set a global fixed size
    }
}

/**
 * Print the label
 */
button.onclick = function () {
    //const node = document.getElementById('label');
    const node = wrapper.querySelector(':first-child');
    const copies = form.querySelector(':last-child')
    console.log(node);
    console.log(copies);
    domtoimage.toBlob(node)
        .then(function (blob) {
            const fd = new FormData();
            fd.append('data', blob);
            fd.append('size', getSize());
            fd.append('copies', copies.value);

            return fetch('/print-multi', {
                method: 'POST',
                body: fd
            });
        })
        .then(function (response) {
            if (!response.ok) {
                throw new Error('Printing failed');
            }
        })
        .catch(function (error) {
            console.error('oops, something went wrong!', error);
            alert(error)
        })
    ;

    /* debugging:
    domtoimage.toPng(node)
        .then(function (dataUrl) {
            var img = new Image();
            img.src = dataUrl;
            document.body.appendChild(img);
        })
        .catch(function (error) {
            console.error('oops, something went wrong!', error);
        });
    */
};
