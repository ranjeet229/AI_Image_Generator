const themeToggle = document.querySelector(".theme-toggle");
const promptForm = document.querySelector(".Prompt-form");
const promptInput = document.querySelector(".prompt-input");
const promptBtn = document.querySelector(".prompt-btn");
const generateBtn = document.querySelector(".generate-btn");
const modelSelect = document.getElementById("model-select");
const countSelect = document.getElementById("count-select");
const ratioSelect = document.getElementById("ratio-select");
const gridGallery = document.querySelector(".gallery-grid");

const API_KEY = "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"; //hugging face api key

const examplePrompts = [
    "A magic forest with glowing plants and fairy homes among giant mushrooms",
    "An old steampunk airship floating through golden clouds at sunset",
    "A future Mars colony with glass domes and gardens against red mountains",
    "A dragon sleeping on gold coins in a crystal cave",
    "An underwater kingdom with merpeople and glowing coral buildings",
    "A floating island with waterfalls pouring into clouds below",
    "A witch's cottage in fall with magic herbs in the garden",
    "A robot painting in a sunny studio with art supplies around it",
    "A magical library with floating glowing books and spiral staircases",
    "A Japanese shrine during cherry blossom season with lanterns and misty mountains",
    "A cosmic beach with glowing sand and an aurora in the night sky",
    "A medieval marketplace with colorful tents and street performers",
    "A cyberpunk city with neon signs and flying cars at night",
    "A peaceful bamboo forest with a hidden ancient temple",
    "A giant turtle carrying a village on its back in the ocean",
  ];

//set theme based on saved preference or system default....>>>
(() => {
    const savedTheme = localStorage.getItem("theme");
    const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

    const isDarkTheme =savedTheme == "dark" || (!savedTheme && systemPrefersDark);
    document.body.classList.toggle("dark-theme", isDarkTheme);
    themeToggle.querySelector("i").className = isDarkTheme ? "fa-solid fa-sun" : "fa-solid fa-moon";
})();


//switch betwenn light and dark themes.....>>>>
const toggleTheme =() => {
    const isDarkTheme = document.body.classList.toggle("dark-theme");
    localStorage.setItem("theme", isDarkTheme ? "dark" : "loght");
    themeToggle.querySelector("i").className = isDarkTheme ? "fa-solid fa-sun" : "fa-solid fa-moon";
};

//calculate width/height based on chosen ratio....>>>
const getImageDimensions = (aspectRatio, baseSize = 512) => {
    const [width, height] = aspectRatio.split("/").map(Number);
    const scaleFactor =baseSize /Math.sqrt(width * height);

    let calculatedwidth =Math.round(width* scaleFactor);
    let calculatedHeight=Math.round(height * scaleFactor);

    calculatedwidth=Math.floor(calculatedwidth / 16) * 16;
    calculatedHeight=Math.floor(calculatedHeight /16) *16;

    return { width: calculatedwidth, height: calculatedHeight };
};

//Replace loading spinner with the actual image
const updateImageCard = (imgIndex, imgUrl) => {
    const imgCard = document.getElementById(`img-card-${imgIndex}`);
    if(!imgCard) return ;

    imgCard.classList.remove("loading");
    imgCard.innerHTML = `<img src="${imgUrl}" class="result-img"/>
                        <div class="image-overlay">
                            <a href="${imgUrl}" class="img-download-btn" download="${Date.now()}.png">
                                <i class="fa-solid fa-download"></i>
                            </a>
                        </div>`;
}

const generateImages = async (selectedModel, imageCount, aspectRatio, promptText) => {
    const MODEL_URL =`https://router.huggingface.co/hf-inference/models/${selectedModel}`;
    const {width, height} = getImageDimensions(aspectRatio);
    generateBtn.setAttribute("disabled", "true");

    //create an array of image generation promises
    const imagePromises= Array.from({length: imageCount}, async(_, i) => {
        try {
            const response = await fetch(MODEL_URL,{
                headers: {
                    Authorization: `Bearer ${API_KEY}`,
                    "Content-Type": "application/json",
                    "x-use-cache":"false",
                },
                method: "POST",
                body: JSON.stringify({
                    inputs: promptText,
                    parameters: {width, height},
                }),
            });

            if(!response.ok) throw new error((await response.json())?.error);

            //convert response to an image url and update the image card
            const result = await response.blob();
            updateImageCard(i, URL.createObjectURL(result));
        } catch(error){
            console.log(error);
            const imgCard =document.getElementById(`img-card-${i}`);
            imgCard.classList.replace("loading", "error");
            imgCard.querySelector(".status-text").textContent="Generation failed! check console for more details.";
        }
    });

    await Promise.allSettled(imagePromises);
    generateBtn.removeAttribute("disabled");
};

//create placehholder cards with loading spinners....>>>
const createImageCards = (selectedModel, imageCount, aspectRatio, promptText) => {
    gridGallery.innerHTML = "";

    for(let i=0 ;i<imageCount; i++){
        gridGallery.innerHTML+= `<div class="img-card loading" id="img-card-${i}" style="aspect-ratio: ${aspectRatio}">
                        <div class="status-container">
                            <div class="spinner"></div>
                            <i class="fa-solid fa-triangle-exclamation"></i>
                            <p class="status-text">Generating...</p>
                        </div>
                    </div>`;
    }

    generateImages(selectedModel, imageCount, aspectRatio, promptText);
}

//handle form values
const handleFormSubmit = (e) =>{
    e.preventDefault();

    //get form values
    const selectedModel = modelSelect.value;
    const imageCount=parseInt(countSelect.value) || 1;
    const aspectRatio=ratioSelect.value || "1/1";
    const promptText = promptInput.value.trim();

    createImageCards(selectedModel, imageCount, aspectRatio, promptText);
};

//Fill prompt input with random example......>>>
promptBtn.addEventListener("click", () => {
    const prompt= examplePrompts[Math.floor(Math.random() * examplePrompts.length)];
    promptInput.value=prompt;
    promptInput.focus();
})

promptForm.addEventListener("submit", handleFormSubmit);
themeToggle.addEventListener("click", toggleTheme);