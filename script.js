document.addEventListener("DOMContentLoaded", async () => {

  /* ================================================= */
  /*                  SUPABASE                          */
  /* ================================================= */

  const SUPABASE_URL =
    "https://codhlmnluxplxmugqwnb.supabase.co";

  const SUPABASE_KEY =
    "sb_publishable_HqCvUjJ2cu_uKNybFWGkiw_C2NFsZfT";

  const supabaseClient =
    window.supabase.createClient(
      SUPABASE_URL,
      SUPABASE_KEY
    );


  /* ================================================= */
  /*                  AUTH ELEMENTS                    */
  /* ================================================= */

  const loginOpen =
    document.getElementById("login-open");

  const loginClose =
    document.getElementById("login-close");

  const loginModal =
    document.getElementById("login-modal");

  const loginForm =
    document.getElementById("login-form");

  const loginEmail =
    document.getElementById("login-email");

  const loginPassword =
    document.getElementById("login-password");

  const loginError =
    document.getElementById("login-error");

  const loginSubmit =
    document.getElementById("login-submit");

  const logoutButton =
    document.getElementById("logout-button");

  const authStatus =
    document.getElementById("auth-status");


  /* ================================================= */
  /*                  AUTH STATE                       */
  /* ================================================= */

  let currentUser = null;


  function showLoginModal() {

    if (!loginModal) {
      return;
    }

    loginModal.classList.remove("hidden");

    if (loginError) {
      loginError.textContent = "";
      loginError.classList.add("hidden");
    }

    setTimeout(() => {

      if (loginEmail) {
        loginEmail.focus();
      }

    }, 50);
  }


  function hideLoginModal() {

    if (!loginModal) {
      return;
    }

    loginModal.classList.add("hidden");

    if (loginForm) {
      loginForm.reset();
    }

    if (loginError) {
      loginError.textContent = "";
      loginError.classList.add("hidden");
    }

  }


  function showLoginError(message) {

    if (!loginError) {
      return;
    }

    loginError.textContent =
      message;

    loginError.classList.remove(
      "hidden"
    );

  }


  function lockSite() {

    currentUser = null;

    if (authStatus) {
      authStatus.textContent =
        "Ви не увійшли";
    }

    if (loginOpen) {
      loginOpen.classList.remove(
        "hidden"
      );
    }

    if (logoutButton) {
      logoutButton.classList.add(
        "hidden"
      );
    }


    /*
     * Поки користувач не авторизований,
     * приховуємо вкладки та сторінки.
     * Саме вікно входу залишається доступним.
     */

    tabs.forEach(tab => {
      tab.disabled = true;
      tab.classList.remove("active");
    });

    pages.forEach(page => {
      page.classList.remove("active");
      page.style.display = "none";
    });

  }


  function unlockSite() {

    if (!currentUser) {
      return;
    }

    if (authStatus) {

      const email =
        currentUser.email || "";

      authStatus.textContent =
        email
          ? `Ви увійшли: ${email}`
          : "Ви увійшли";

    }


    if (loginOpen) {
      loginOpen.classList.add(
        "hidden"
      );
    }


    if (logoutButton) {
      logoutButton.classList.remove(
        "hidden"
      );
    }


    tabs.forEach(tab => {
      tab.disabled = false;
    });


    /*
     * Відновлюємо останню відкриту
     * вкладку після авторизації.
     */

    const savedTab =
      localStorage.getItem(
        TAB_STORAGE_KEY
      );

    if (
      savedTab &&
      document.getElementById(savedTab)
    ) {

      activateTab(savedTab);

    } else {

      activateTab("blocks");

    }

  }


  /* ================================================= */
  /*              AUTHORIZATION LOGIN                  */
  /* ================================================= */

  if (loginOpen) {

    loginOpen.addEventListener(
      "click",
      () => {
        showLoginModal();
      }
    );

  }


  if (loginClose) {

    loginClose.addEventListener(
      "click",
      () => {
        hideLoginModal();
      }
    );

  }


  const authOverlay =
    document.querySelector(
      ".auth-overlay"
    );

  if (authOverlay) {

    authOverlay.addEventListener(
      "click",
      () => {
        hideLoginModal();
      }
    );

  }


  if (loginForm) {

    loginForm.addEventListener(
      "submit",
      async (event) => {

        event.preventDefault();


        const email =
          loginEmail.value.trim();

        const password =
          loginPassword.value;


        if (!email || !password) {

          showLoginError(
            "Введіть email та пароль."
          );

          return;
        }


        loginSubmit.disabled = true;

        loginSubmit.textContent =
          "Вхід...";


        if (loginError) {
          loginError.classList.add(
            "hidden"
          );
        }


        try {

          const {
            data,
            error
          } =
            await supabaseClient.auth
              .signInWithPassword({
                email,
                password
              });


          if (error) {
            throw error;
          }


          currentUser =
            data.user;


          hideLoginModal();

          unlockSite();


          /*
           * Після входу завантажуємо
           * дані продукції.
           *
           * Функція буде визначена
           * нижче у цьому файлі.
           */

          await loadProductsFromSupabase();


        } catch (error) {

          console.error(
            "Login error:",
            error
          );


          let message =
            "Не вдалося виконати вхід.";


          if (
            error &&
            error.message
          ) {

            if (
              error.message
                .toLowerCase()
                .includes("invalid login")
            ) {

              message =
                "Неправильний email або пароль.";

            } else {

              message =
                error.message;

            }

          }


          showLoginError(
            message
          );

        } finally {

          loginSubmit.disabled =
            false;

          loginSubmit.textContent =
            "Увійти";

        }

      }
    );

  }


  /* ================================================= */
  /*                  LOGOUT                            */
  /* ================================================= */

  if (logoutButton) {

    logoutButton.addEventListener(
      "click",
      async () => {

        logoutButton.disabled =
          true;

        logoutButton.textContent =
          "Вихід...";


        try {

          const {
            error
          } =
            await supabaseClient.auth
              .signOut();


          if (error) {
            throw error;
          }


          currentUser = null;

          lockSite();

          hideLoginModal();


        } catch (error) {

          console.error(
            "Logout error:",
            error
          );

          alert(
            "Не вдалося вийти з акаунта."
          );

        } finally {

          logoutButton.disabled =
            false;

          logoutButton.textContent =
            "Вийти";

        }

      }
    );

  }


  /* ================================================= */
  /*                  TABS                             */
  /* ================================================= */

  const tabs =
    document.querySelectorAll(
      ".tab"
    );

  const pages =
    document.querySelectorAll(
      ".page"
    );

  const TAB_STORAGE_KEY =
    "kbjv-active-tab";


  function activateTab(target) {

    tabs.forEach(tab => {

      tab.classList.toggle(
        "active",
        tab.dataset.tab === target
      );

    });


    pages.forEach(page => {

      page.classList.toggle(
        "active",
        page.id === target
      );

      if (
        page.id === target &&
        currentUser
      ) {

        page.style.display = "";

      } else {

        page.style.display =
          "none";

      }

    });


    localStorage.setItem(
      TAB_STORAGE_KEY,
      target
    );

  }


  tabs.forEach(tab => {

    tab.addEventListener(
      "click",
      () => {

        if (!currentUser) {
          return;
        }

        activateTab(
          tab.dataset.tab
        );

      }
    );

  });


  /* ================================================= */
  /*                  PRODUCTS                         */
  /* ================================================= */

  let products = [];

  let productsLoaded =
    false;


  /*
   * Початкові статичні картки
   * з HTML залишаються як fallback.
   *
   * Після авторизації Supabase
   * замінить їх продукцією з БД.
   */

  function getFoodCards() {

    return document.querySelectorAll(
      ".food-card"
    );

  }


  /* ================================================= */
  /*             PRODUCT SUPABASE LOAD                 */
  /* ================================================= */

  async function loadProductsFromSupabase() {

    if (!currentUser) {
      return;
    }


    try {

      const {
        data,
        error
      } =
        await supabaseClient
          .from("products")
          .select("*")
          .order(
            "name",
            {
              ascending: true
            }
          );


      if (error) {
        throw error;
      }


      products =
        Array.isArray(data)
          ? data
          : [];


      productsLoaded =
        true;


      renderProducts();


    } catch (error) {

      console.error(
        "Products loading error:",
        error
      );


      /*
       * Якщо таблиця ще порожня,
       * залишаємо HTML-картки.
       */

      productsLoaded =
        false;

    }

  }


  /* ================================================= */
  /*             PRODUCT CARD CREATION                 */
  /* ================================================= */

  function createProductCard(product) {

    const card =
      document.createElement(
        "article"
      );


    card.className =
      "food-card";


    card.dataset.text =
      product.name || "";


    card.dataset.kcal =
      product.kcal ?? 0;


    card.dataset.protein =
      product.protein ?? 0;


    card.dataset.fat =
      product.fat ?? 0;


    card.dataset.carb =
      product.carbs ??
      product.carb ??
      0;


    card.dataset.barcode =
      product.barcode || "";


    const unit =
      product.unit ||
      "г";


    const name =
      product.name ||
      "Без назви";


    const kcal =
      Number(product.kcal) || 0;


    const protein =
      Number(product.protein) || 0;


    const fat =
      Number(product.fat) || 0;


    const carbs =
      Number(
        product.carbs ??
        product.carb ??
        0
      );


    const badge =
      name
        .trim()
        .slice(0, 2)
        .toUpperCase();


    card.innerHTML = `

      <div
        class="copy-btn"
        title="Скопіювати блок"
      >

        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >

          <path
            d="M16 21H6a2 2 0 0 1-2-2V7"
            stroke="currentColor"
            stroke-width="1.6"
            stroke-linecap="round"
            stroke-linejoin="round"
          />

          <rect
            x="8"
            y="3"
            width="13"
            height="13"
            rx="2"
            stroke="currentColor"
            stroke-width="1.6"
            stroke-linecap="round"
            stroke-linejoin="round"
          />

        </svg>

        <span class="tooltip">
          Скопійовано
        </span>

      </div>


      <div
        class="food-title"
        style="padding-right:50px"
      >

        <div class="badge">
          ${escapeHTML(badge)}
        </div>

        <div>

          <div class="name">
            ${escapeHTML(name)}
          </div>

          <div class="meta">
            100 ${escapeHTML(unit)}
          </div>

        </div>

      </div>


      <div class="kbjv">

        <div class="row">

          <div class="key">
            Калорії
          </div>

          <div class="val">
            ${kcal} ккал
          </div>

        </div>


        <div class="row">

          <div class="key">
            Білки
          </div>

          <div class="val">
            ${protein} г
          </div>

        </div>


        <div class="row">

          <div class="key">
            Жири
          </div>

          <div class="val">
            ${fat} г
          </div>

        </div>


        <div class="row">

          <div class="key">
            Вуглеводи
          </div>

          <div class="val">
            ${carbs} г
          </div>

        </div>

      </div>


      <div class="full-name">
        ${escapeHTML(
      product.full_name ||
      product.description ||
      name
    )}
      </div>

    `;


    return card;

  }


  /* ================================================= */
  /*             RENDER PRODUCTS                       */
  /* ================================================= */

  function renderProducts() {

    const grid =
      document.getElementById(
        "grid"
      );


    if (!grid) {
      return;
    }


    /*
     * Якщо Supabase повернув продукцію,
     * використовуємо її.
     */

    if (
      productsLoaded &&
      products.length > 0
    ) {

      grid.innerHTML = "";


      products.forEach(
        product => {

          grid.appendChild(
            createProductCard(
              product
            )
          );

        }
      );


      /*
       * Повторно застосовуємо
       * пошуковий фільтр.
       */

      if (
        searchInput &&
        searchInput.value.trim()
      ) {

        filterProducts(
          searchInput.value
        );

      }

    }

  }


  /* ================================================= */
  /*                  SEARCH                            */
  /* ================================================= */

  const searchInput =
    document.getElementById(
      "search"
    );


  const clearSearch =
    document.getElementById(
      "clear-search"
    );


  function filterProducts(value) {

    const query =
      String(value || "")
        .toLowerCase()
        .trim();


    getFoodCards().forEach(
      card => {

        const name =
          (
            card.getAttribute(
              "data-text"
            ) || ""
          )
            .toLowerCase()
            .trim();


        const barcode =
          (
            card.getAttribute(
              "data-barcode"
            ) || ""
          )
            .toLowerCase()
            .trim();


        card.style.display =
          (
            name.includes(query) ||
            barcode.includes(query)
          )
            ? ""
            : "none";

      }
    );


    if (clearSearch) {

      clearSearch.style.display =
        query
          ? "inline"
          : "none";

    }

  }


  if (searchInput) {

    searchInput.addEventListener(
      "input",
      () => {

        filterProducts(
          searchInput.value
        );

      }
    );

  }


  if (clearSearch) {

    clearSearch.addEventListener(
      "click",
      () => {

        searchInput.value = "";

        filterProducts("");

        searchInput.focus();

      }
    );

  }


  /* ================================================= */
  /*             PRODUCT COPY                         */
  /* ================================================= */

  document.addEventListener(
    "click",
    async event => {

      const btn =
        event.target.closest(
          ".copy-btn"
        );


      if (!btn) {
        return;
      }


      const card =
        btn.closest(
          ".food-card"
        );


      if (!card) {
        return;
      }


      const name =
        card.getAttribute(
          "data-text"
        ) || "Продукт";


      const kcal100 =
        parseFloat(
          card.getAttribute(
            "data-kcal"
          )
        ) || 0;


      const protein100 =
        parseFloat(
          card.getAttribute(
            "data-protein"
          )
        ) || 0;


      const fat100 =
        parseFloat(
          card.getAttribute(
            "data-fat"
          )
        ) || 0;


      const carb100 =
        parseFloat(
          card.getAttribute(
            "data-carb"
          )
        ) || 0;


      const weight =
        parseFloat(
          prompt(
            `Введіть вагу продукту у грамах для "${name}"`,
            "100"
          )
        );


      if (
        Number.isNaN(weight) ||
        weight <= 0
      ) {

        return;

      }


      const kcal =
        (
          kcal100 *
          weight /
          100
        ).toFixed(0);


      const protein =
        (
          protein100 *
          weight /
          100
        ).toFixed(1);


      const fat =
        (
          fat100 *
          weight /
          100
        ).toFixed(1);


      const carb =
        (
          carb100 *
          weight /
          100
        ).toFixed(1);


      const text =
        `${name}, для ${weight} грам - ` +
        `${kcal} ккал / ` +
        `${protein} білка / ` +
        `${fat} жирів / ` +
        `${carb} вуглеводів`;


      try {

        await navigator.clipboard.writeText(
          text
        );


        btn.classList.add(
          "copied"
        );


        const tooltip =
          btn.querySelector(
            ".tooltip"
          );


        if (tooltip) {

          tooltip.textContent =
            "Скопійовано";

        }


        setTimeout(
          () => {

            btn.classList.remove(
              "copied"
            );

          },
          1200
        );


      } catch (error) {

        console.error(
          "Clipboard error:",
          error
        );


        const tooltip =
          btn.querySelector(
            ".tooltip"
          );


        if (tooltip) {

          tooltip.textContent =
            "Помилка";

        }


        btn.classList.add(
          "copied"
        );


        setTimeout(
          () => {

            btn.classList.remove(
              "copied"
            );

          },
          1400
        );

      }

    }
  );


  /* ================================================= */
  /*                  CALCULATOR                       */
  /* ================================================= */

  let total = {

    kcal: 0,

    protein: 0,

    fat: 0,

    carb: 0

  };


  const calcLog = [];


  const CALC_TOTAL_KEY =
    "kbjv-total";


  const CALC_LOG_KEY =
    "kbjv-log";


  const CALC_INPUT_KEY =
    "kbjv-calculator-input";


  function saveCalculator() {

    localStorage.setItem(
      CALC_TOTAL_KEY,
      JSON.stringify(total)
    );


    localStorage.setItem(
      CALC_LOG_KEY,
      JSON.stringify(calcLog)
    );

  }


  function loadCalculator() {

    try {

      const savedTotal =
        localStorage.getItem(
          CALC_TOTAL_KEY
        );


      const savedLog =
        localStorage.getItem(
          CALC_LOG_KEY
        );


      if (savedTotal) {

        const parsed =
          JSON.parse(
            savedTotal
          );


        total.kcal =
          Number(
            parsed.kcal
          ) || 0;


        total.protein =
          Number(
            parsed.protein
          ) || 0;


        total.fat =
          Number(
            parsed.fat
          ) || 0;


        total.carb =
          Number(
            parsed.carb
          ) || 0;

      }


      if (savedLog) {

        const parsed =
          JSON.parse(
            savedLog
          );


        calcLog.length = 0;

        calcLog.push(
          ...parsed
        );

      }


    } catch (error) {

      console.error(
        "Calculator storage error:",
        error
      );

    }

  }


  /* ================================================= */
  /*              CALCULATOR INPUT                    */
  /* ================================================= */

  const calcInput =
    document.getElementById(
      "calc-input"
    );


  const savedCalcInput =
    localStorage.getItem(
      CALC_INPUT_KEY
    );


  if (
    calcInput &&
    savedCalcInput !== null
  ) {

    calcInput.value =
      savedCalcInput;

  }


  if (calcInput) {

    calcInput.addEventListener(
      "input",
      () => {

        localStorage.setItem(
          CALC_INPUT_KEY,
          calcInput.value
        );

      }
    );

  }


  /* ================================================= */
  /*                  PARSER                           */
  /* ================================================= */

  function parseLine(line) {

    const kcal =
      line.match(
        /(\d+(?:[.,]\d+)?)\s*ккал/i
      );


    const protein =
      line.match(
        /(\d+(?:[.,]\d+)?)\s*біл/i
      );


    const fat =
      line.match(
        /(\d+(?:[.,]\d+)?)\s*жир/i
      );


    const carb =
      line.match(
        /(\d+(?:[.,]\d+)?)\s*вугл/i
      );


    return {

      kcal:
        kcal
          ? Number(
            kcal[1]
              .replace(",", ".")
          )
          : 0,


      protein:
        protein
          ? Number(
            protein[1]
              .replace(",", ".")
          )
          : 0,


      fat:
        fat
          ? Number(
            fat[1]
              .replace(",", ".")
          )
          : 0,


      carb:
        carb
          ? Number(
            carb[1]
              .replace(",", ".")
          )
          : 0

    };

  }


  /* ================================================= */
  /*             RENDER CALCULATOR                    */
  /* ================================================= */

  function renderCalculator() {

    const kcalElement =
      document.getElementById(
        "kcal"
      );


    const proteinElement =
      document.getElementById(
        "protein"
      );


    const fatElement =
      document.getElementById(
        "fat"
      );


    const carbElement =
      document.getElementById(
        "carb"
      );


    if (kcalElement) {

      kcalElement.textContent =
        total.kcal.toFixed(0);

    }


    if (proteinElement) {

      proteinElement.textContent =
        total.protein.toFixed(1);

    }


    if (fatElement) {

      fatElement.textContent =
        total.fat.toFixed(1);

    }


    if (carbElement) {

      carbElement.textContent =
        total.carb.toFixed(1);

    }


    const log =
      document.getElementById(
        "calc-log"
      );


    if (!log) {
      return;
    }


    log.innerHTML =
      calcLog
        .map(
          (item, index) => `

            <div class="log-item">

              <span>
                ${escapeHTML(
            item.text
          )}
              </span>

              <button
                data-index="${index}"
                class="remove calc-remove"
              >
                Відняти
              </button>

            </div>

          `
        )
        .join("");

  }


  /* ================================================= */
  /*                  ADD                              */
  /* ================================================= */

  const calcAdd =
    document.getElementById(
      "calc-add"
    );


  if (calcAdd) {

    calcAdd.addEventListener(
      "click",
      () => {

        const text =
          calcInput
            ? calcInput.value.trim()
            : "";


        if (!text) {

          calcAdd.textContent =
            "Немає даних ✕";


          calcAdd.classList.add(
            "error"
          );


          setTimeout(
            () => {

              calcAdd.textContent =
                "Додати";

              calcAdd.classList.remove(
                "error"
              );

            },
            1200
          );


          return;

        }


        const lines =
          text
            .split("\n")
            .map(
              line =>
                line.trim()
            )
            .filter(Boolean);


        for (
          const line of lines
        ) {

          const parsed =
            parseLine(line);


          total.kcal +=
            parsed.kcal;


          total.protein +=
            parsed.protein;


          total.fat +=
            parsed.fat;


          total.carb +=
            parsed.carb;


          calcLog.push({

            text: line,

            kcal:
              parsed.kcal,

            protein:
              parsed.protein,

            fat:
              parsed.fat,

            carb:
              parsed.carb

          });

        }


        calcInput.value = "";


        localStorage.removeItem(
          CALC_INPUT_KEY
        );


        renderCalculator();

        saveCalculator();


        calcAdd.textContent =
          "Додано ✓";


        calcAdd.classList.add(
          "success"
        );


        setTimeout(
          () => {

            calcAdd.textContent =
              "Додати";

            calcAdd.classList.remove(
              "success"
            );

          },
          1200
        );

      }
    );

  }


  /* ================================================= */
  /*                  REMOVE                           */
  /* ================================================= */

  const calcLogElement =
    document.getElementById(
      "calc-log"
    );


  if (calcLogElement) {

    calcLogElement.addEventListener(
      "click",
      event => {

        const btn =
          event.target.closest(
            ".calc-remove"
          );


        if (!btn) {
          return;
        }


        const index =
          Number(
            btn.dataset.index
          );


        const item =
          calcLog[index];


        if (!item) {
          return;
        }


        total.kcal -=
          Number(item.kcal) || 0;


        total.protein -=
          Number(item.protein) || 0;


        total.fat -=
          Number(item.fat) || 0;


        total.carb -=
          Number(item.carb) || 0;


        total.kcal =
          Math.max(
            0,
            total.kcal
          );


        total.protein =
          Math.max(
            0,
            total.protein
          );


        total.fat =
          Math.max(
            0,
            total.fat
          );


        total.carb =
          Math.max(
            0,
            total.carb
          );


        calcLog.splice(
          index,
          1
        );


        renderCalculator();

        saveCalculator();

      }
    );

  }


  /* ================================================= */
  /*              CLEAR TEXT                           */
  /* ================================================= */

  const calcClearText =
    document.getElementById(
      "calc-clear-text"
    );


  if (calcClearText) {

    calcClearText.addEventListener(
      "click",
      () => {

        if (
          !calcInput ||
          !calcInput.value.trim()
        ) {

          calcClearText.textContent =
            "Немає даних ✕";


          calcClearText.classList.add(
            "error"
          );


          setTimeout(
            () => {

              calcClearText.textContent =
                "Очистити текст";

              calcClearText.classList.remove(
                "error"
              );

            },
            1200
          );


          return;

        }


        calcInput.value = "";


        localStorage.removeItem(
          CALC_INPUT_KEY
        );


        calcClearText.textContent =
          "Очищено ✓";


        calcClearText.classList.add(
          "success"
        );


        setTimeout(
          () => {

            calcClearText.textContent =
              "Очистити текст";

            calcClearText.classList.remove(
              "success"
            );

          },
          1200
        );

      }
    );

  }


  /* ================================================= */
  /*              CLEAR BLOCKS                        */
  /* ================================================= */

  const calcClearBlocks =
    document.getElementById(
      "calc-clear-blocks"
    );


  if (calcClearBlocks) {

    calcClearBlocks.addEventListener(
      "click",
      () => {

        if (
          calcLog.length === 0
        ) {

          calcClearBlocks.textContent =
            "Немає даних ✕";


          calcClearBlocks.classList.add(
            "error"
          );


          setTimeout(
            () => {

              calcClearBlocks.textContent =
                "Очистити блоки";

              calcClearBlocks.classList.remove(
                "error"
              );

            },
            1200
          );


          return;

        }


        total = {

          kcal: 0,

          protein: 0,

          fat: 0,

          carb: 0

        };


        calcLog.length = 0;


        renderCalculator();

        saveCalculator();


        calcClearBlocks.textContent =
          "Очищено ✓";


        calcClearBlocks.classList.add(
          "success"
        );


        setTimeout(
          () => {

            calcClearBlocks.textContent =
              "Очистити блоки";

            calcClearBlocks.classList.remove(
              "success"
            );

          },
          1200
        );

      }
    );

  }


  /* ================================================= */
  /*                  DAILY SUMMARY                   */
  /* ================================================= */

  function getDailySummary(
    date = null
  ) {

    const d =
      date
        ? new Date(
          `${date}T12:00:00`
        )
        : new Date();


    const day =
      String(
        d.getDate()
      ).padStart(
        2,
        "0"
      );


    const month =
      String(
        d.getMonth() + 1
      ).padStart(
        2,
        "0"
      );


    const year =
      d.getFullYear();


    return (
      `Денний підсумок за ` +
      `${day}.${month}.${year} - ` +
      `${total.kcal.toFixed(0)} ккал / ` +
      `${total.protein.toFixed(1)} білка / ` +
      `${total.fat.toFixed(1)} жирів / ` +
      `${total.carb.toFixed(1)} вуглеводів`
    );

  }


  /* ================================================= */
  /*                  COPY SUMMARY                     */
  /* ================================================= */

  const copyTotal =
    document.getElementById(
      "copy-total"
    );


  if (copyTotal) {

    copyTotal.addEventListener(
      "click",
      async () => {

        const text =
          getDailySummary();


        try {

          await navigator.clipboard.writeText(
            text
          );


          copyTotal.textContent =
            "Скопійовано ✓";


          copyTotal.classList.add(
            "success"
          );


          setTimeout(
            () => {

              copyTotal.textContent =
                "Скопіювати підсумок";

              copyTotal.classList.remove(
                "success"
              );

            },
            1200
          );


        } catch (error) {

          console.error(
            "Summary clipboard error:",
            error
          );


          copyTotal.textContent =
            "Помилка";


          copyTotal.classList.add(
            "error"
          );


          setTimeout(
            () => {

              copyTotal.textContent =
                "Скопіювати підсумок";

              copyTotal.classList.remove(
                "error"
              );

            },
            1200
          );

        }

      }
    );

  }


  /* ================================================= */
  /*                  ARCHIVE                          */
  /* ================================================= */

  const ARCHIVE_KEY =
    "kbzv_archive";


  let archive = [];


  function normalizeArchive() {

    const saved =
      localStorage.getItem(
        ARCHIVE_KEY
      );


    if (!saved) {

      archive = [];

      return;

    }


    try {

      const parsed =
        JSON.parse(saved);


      if (
        !Array.isArray(parsed)
      ) {

        archive = [];

        return;

      }


      archive =
        parsed
          .map(item => {

            if (
              typeof item === "object" &&
              item !== null &&
              item.text
            ) {

              return {

                date:
                  item.date ||
                  extractDateFromSummary(
                    item.text
                  ),

                text:
                  item.text

              };

            }


            if (
              typeof item ===
              "string"
            ) {

              return {

                date:
                  extractDateFromSummary(
                    item
                  ),

                text:
                  item

              };

            }


            return null;

          })
          .filter(Boolean);


      saveArchive();


    } catch (error) {

      console.error(
        "Archive storage error:",
        error
      );


      archive = [];

    }

  }


  /* ================================================= */
  /*             EXTRACT DATE FROM TEXT                */
  /* ================================================= */

  function extractDateFromSummary(
    text
  ) {

    const match =
      text.match(
        /Денний підсумок за\s+(\d{2})\.(\d{2})\.(\d{4})/
      );


    if (!match) {

      return getTodayInputDate();

    }


    return (
      `${match[3]}-` +
      `${match[2]}-` +
      `${match[1]}`
    );

  }


  /* ================================================= */
  /*                  DATE HELPERS                     */
  /* ================================================= */

  function getTodayInputDate() {

    const d =
      new Date();


    const year =
      d.getFullYear();


    const month =
      String(
        d.getMonth() + 1
      ).padStart(
        2,
        "0"
      );


    const day =
      String(
        d.getDate()
      ).padStart(
        2,
        "0"
      );


    return (
      `${year}-${month}-${day}`
    );

  }


  function formatDate(date) {

    if (!date) {
      return "";
    }


    const parts =
      date.split("-");


    if (
      parts.length !== 3
    ) {

      return date;

    }


    return (
      `${parts[2]}.` +
      `${parts[1]}.` +
      `${parts[0]}`
    );

  }


  function updateSummaryDate(
    text,
    newDate
  ) {

    const formattedDate =
      formatDate(
        newDate
      );


    return text.replace(
      /Денний підсумок за\s+\d{2}\.\d{2}\.\d{4}/,
      `Денний підсумок за ${formattedDate}`
    );

  }


  /* ================================================= */
  /*                  ARCHIVE STORAGE                  */
  /* ================================================= */

  function saveArchive() {

    localStorage.setItem(
      ARCHIVE_KEY,
      JSON.stringify(
        archive
      )
    );

  }


  /* ================================================= */
  /*          ARCHIVE BUTTON FEEDBACK                 */
  /* ================================================= */

  function showDateSuccess(
    button
  ) {

    button.textContent =
      "Змінено дату ✓";


    button.classList.remove(
      "error"
    );


    button.classList.add(
      "success"
    );


    setTimeout(
      () => {

        if (
          !document.body.contains(
            button
          )
        ) {

          return;

        }


        button.textContent =
          "Змінити дату";


        button.classList.remove(
          "success"
        );

      },
      1200
    );

  }


  function showDateError(
    button
  ) {

    button.textContent =
      "Дату не змінено ✕";


    button.classList.remove(
      "success"
    );


    button.classList.add(
      "error"
    );


    setTimeout(
      () => {

        if (
          !document.body.contains(
            button
          )
        ) {

          return;

        }


        button.textContent =
          "Змінити дату";


        button.classList.remove(
          "error"
        );

      },
      1200
    );

  }


  /* ================================================= */
  /*             FINISH DATE EDIT                     */
  /* ================================================= */

  function finishDateEdit(
    row,
    item,
    editBtn,
    dateInput,
    originalDate
  ) {

    if (
      !dateInput ||
      !document.body.contains(
        dateInput
      )
    ) {

      return;

    }


    const selectedDate =
      dateInput.value;


    const finalDate =
      selectedDate ||
      originalDate;


    const dateChanged =
      finalDate !==
      originalDate;


    if (dateChanged) {

      item.date =
        finalDate;


      item.text =
        updateSummaryDate(
          item.text,
          finalDate
        );


      saveArchive();


      showDateSuccess(
        editBtn
      );


    } else {

      showDateError(
        editBtn
      );

    }


    dateInput.remove();

  }
  /* ================================================= */
  /*                  ARCHIVE RENDER                   */
  /* ================================================= */

  function renderArchive() {

    const archiveLog =
      document.getElementById(
        "archive-log"
      );


    if (!archiveLog) {
      return;
    }


    if (archive.length === 0) {

      archiveLog.innerHTML =
        `
          <div class="log-item">
            Архів порожній.
          </div>
        `;

      return;

    }


    archiveLog.innerHTML =
      archive
        .map(
          (item, index) => {

            const date =
              item.date ||
              extractDateFromSummary(
                item.text
              );


            return `

              <div
                class="log-item archive-item"
                data-index="${index}"
              >

                <div class="archive-content">

                  <span>
                    ${escapeHTML(
              item.text
            )}
                  </span>

                </div>


                <div class="archive-actions">

                  <button
                    type="button"
                    class="edit-date"
                    data-index="${index}"
                  >
                    Змінити дату
                  </button>


                  <button
                    type="button"
                    class="remove archive-remove"
                    data-index="${index}"
                  >
                    Видалити
                  </button>

                </div>

              </div>

            `;

          }
        )
        .join("");

  }


  /* ================================================= */
  /*             ARCHIVE DATE EDIT                    */
  /* ================================================= */

  const archiveLog =
    document.getElementById(
      "archive-log"
    );


  if (archiveLog) {

    archiveLog.addEventListener(
      "click",
      event => {

        const editButton =
          event.target.closest(
            ".edit-date"
          );


        if (editButton) {

          const index =
            Number(
              editButton.dataset.index
            );


          const item =
            archive[index];


          if (!item) {
            return;
          }


          const row =
            editButton.closest(
              ".archive-item"
            );


          if (!row) {
            return;
          }


          /*
           * Якщо поле дати вже відкрите,
           * друге натискання означає
           * підтвердження зміни.
           */

          const existingInput =
            row.querySelector(
              ".archive-date-input"
            );


          if (existingInput) {

            const originalDate =
              item.date ||
              extractDateFromSummary(
                item.text
              );


            finishDateEdit(
              row,
              item,
              editButton,
              existingInput,
              originalDate
            );


            renderArchive();

            return;

          }


          const originalDate =
            item.date ||
            extractDateFromSummary(
              item.text
            );


          const dateInput =
            document.createElement(
              "input"
            );


          dateInput.type =
            "date";


          dateInput.className =
            "archive-date-input";


          dateInput.value =
            originalDate;


          /*
           * Ставимо поле перед кнопкою
           * зміни дати.
           */

          editButton.parentNode.insertBefore(
            dateInput,
            editButton
          );


          editButton.textContent =
            "Зберегти";


          dateInput.focus();


          /*
           * Enter = зберегти.
           */

          dateInput.addEventListener(
            "keydown",
            keyboardEvent => {

              if (
                keyboardEvent.key ===
                "Enter"
              ) {

                keyboardEvent.preventDefault();


                finishDateEdit(
                  row,
                  item,
                  editButton,
                  dateInput,
                  originalDate
                );


                renderArchive();

              }


              if (
                keyboardEvent.key ===
                "Escape"
              ) {

                dateInput.remove();

                editButton.textContent =
                  "Змінити дату";

              }

            }
          );


          return;

        }


        /* =========================================== */
        /*              DELETE ARCHIVE                  */
        /* =========================================== */

        const removeButton =
          event.target.closest(
            ".archive-remove"
          );


        if (
          removeButton
        ) {

          const index =
            Number(
              removeButton.dataset.index
            );


          if (
            Number.isNaN(index) ||
            !archive[index]
          ) {

            return;

          }


          showArchiveDeleteConfirmation(
            index
          );

        }

      }
    );

  }


  /* ================================================= */
  /*          ARCHIVE DELETE CONFIRMATION             */
  /* ================================================= */

  function showArchiveDeleteConfirmation(
    index
  ) {

    /*
     * Якщо модальне вікно вже існує,
     * видаляємо його.
     */

    const oldConfirm =
      document.querySelector(
        ".archive-confirm"
      );


    if (oldConfirm) {
      oldConfirm.remove();
    }


    const item =
      archive[index];


    if (!item) {
      return;
    }


    const overlay =
      document.createElement(
        "div"
      );


    overlay.className =
      "archive-confirm";


    overlay.innerHTML = `

      <div
        class="archive-confirm-box"
      >

        <div
          class="archive-confirm-title"
        >
          Видалити запис?
        </div>


        <div
          class="archive-confirm-text"
        >
          Ви дійсно хочете видалити
          цей запис з архіву?
        </div>


        <div
          class="archive-confirm-actions"
        >

          <button
            type="button"
            class="archive-confirm-cancel"
          >
            Скасувати
          </button>


          <button
            type="button"
            class="archive-confirm-ok"
          >
            Видалити
          </button>

        </div>

      </div>

    `;


    document.body.appendChild(
      overlay
    );


    const cancel =
      overlay.querySelector(
        ".archive-confirm-cancel"
      );


    const ok =
      overlay.querySelector(
        ".archive-confirm-ok"
      );


    function close() {

      overlay.remove();

    }


    cancel.addEventListener(
      "click",
      close
    );


    overlay.addEventListener(
      "click",
      event => {

        if (
          event.target ===
          overlay
        ) {

          close();

        }

      }
    );


    ok.addEventListener(
      "click",
      () => {

        archive.splice(
          index,
          1
        );


        saveArchive();

        renderArchive();

        close();

      }
    );


    document.addEventListener(
      "keydown",
      function escapeHandler(
        event
      ) {

        if (
          event.key ===
          "Escape"
        ) {

          close();

          document.removeEventListener(
            "keydown",
            escapeHandler
          );

        }

      }
    );

  }


  /* ================================================= */
  /*              SAVE TO ARCHIVE                     */
  /* ================================================= */

  const saveArchiveButton =
    document.getElementById(
      "save-archive"
    );


  if (saveArchiveButton) {

    saveArchiveButton.addEventListener(
      "click",
      () => {

        const summary =
          getDailySummary();


        /*
         * Не дозволяємо зберігати
         * повністю порожній день.
         */

        if (
          total.kcal === 0 &&
          total.protein === 0 &&
          total.fat === 0 &&
          total.carb === 0
        ) {

          saveArchiveButton.textContent =
            "Немає даних ✕";


          saveArchiveButton.classList.add(
            "error"
          );


          setTimeout(
            () => {

              saveArchiveButton.textContent =
                "Зберегти в архів";


              saveArchiveButton.classList.remove(
                "error"
              );

            },
            1200
          );


          return;

        }


        const date =
          getTodayInputDate();


        /*
         * Якщо за сьогодні вже є запис,
         * не створюємо дубль автоматично.
         */

        const alreadyExists =
          archive.some(
            item => {

              const itemDate =
                item.date ||
                extractDateFromSummary(
                  item.text
                );


              return (
                itemDate ===
                date
              );

            }
          );


        if (alreadyExists) {

          saveArchiveButton.textContent =
            "Вже збережено ✕";


          saveArchiveButton.classList.add(
            "error"
          );


          setTimeout(
            () => {

              saveArchiveButton.textContent =
                "Зберегти в архів";


              saveArchiveButton.classList.remove(
                "error"
              );

            },
            1400
          );


          return;

        }


        archive.push({

          date,

          text:
            summary

        });


        saveArchive();

        renderArchive();


        saveArchiveButton.textContent =
          "Збережено ✓";


        saveArchiveButton.classList.add(
          "success"
        );


        setTimeout(
          () => {

            saveArchiveButton.textContent =
              "Зберегти в архів";


            saveArchiveButton.classList.remove(
              "success"
            );

          },
          1200
        );

      }
    );

  }


  /* ================================================= */
  /*             PRODUCT IMPORT / EXPORT              */
  /* ================================================= */

  /*
   * Цей блок працює з продукцією,
   * яка знаходиться у Supabase.
   *
   * Експорт створює компактний JSON-файл.
   * Імпорт відправляє продукцію назад
   * у таблицю products.
   */


  function normalizeProductForExport(
    product
  ) {

    return {

      name:
        product.name || "",


      barcode:
        product.barcode || "",


      unit:
        product.unit || "г",


      kcal:
        Number(
          product.kcal
        ) || 0,


      protein:
        Number(
          product.protein
        ) || 0,


      fat:
        Number(
          product.fat
        ) || 0,


      carbs:
        Number(
          product.carbs ??
          product.carb ??
          0
        ),


      full_name:
        product.full_name ||
        product.description ||
        ""

    };

  }


  async function exportProducts() {

    if (!currentUser) {

      alert(
        "Спочатку увійдіть."
      );

      return;

    }


    try {

      /*
       * Беремо актуальні дані
       * безпосередньо з Supabase.
       */

      const {
        data,
        error
      } =
        await supabaseClient
          .from("products")
          .select("*")
          .order(
            "name",
            {
              ascending: true
            }
          );


      if (error) {
        throw error;
      }


      const exportData = {

        version:
          1,

        exported_at:
          new Date()
            .toISOString(),

        products:
          (data || [])
            .map(
              normalizeProductForExport
            )

      };


      const json =
        JSON.stringify(
          exportData
        );


      const blob =
        new Blob(
          [json],
          {
            type:
              "application/json"
          }
        );


      const url =
        URL.createObjectURL(
          blob
        );


      const link =
        document.createElement(
          "a"
        );


      link.href =
        url;


      link.download =
        `kbjv-products-${getTodayInputDate()}.json`;


      document.body.appendChild(
        link
      );


      link.click();

      link.remove();


      URL.revokeObjectURL(
        url
      );


    } catch (error) {

      console.error(
        "Export error:",
        error
      );


      alert(
        "Не вдалося експортувати продукцію."
      );

    }

  }


  async function importProductsFromFile(
    file
  ) {

    if (!currentUser) {

      alert(
        "Спочатку увійдіть."
      );

      return;

    }


    if (!file) {
      return;
    }


    try {

      const text =
        await file.text();


      const parsed =
        JSON.parse(
          text
        );


      const importedProducts =
        Array.isArray(parsed)
          ? parsed
          : parsed.products;


      if (
        !Array.isArray(
          importedProducts
        )
      ) {

        throw new Error(
          "Неправильний формат файлу."
        );

      }


      const cleaned =
        importedProducts
          .map(
            normalizeProductForExport
          )
          .filter(
            product =>
              product.name
                .trim()
                .length > 0
          );


      if (
        cleaned.length === 0
      ) {

        throw new Error(
          "Файл не містить продукції."
        );

      }


      /*
       * upsert дозволяє імпортувати
       * існуючі продукти без створення
       * зайвих дублікатів, якщо схема
       * таблиці це підтримує.
       */

      const {
        error
      } =
        await supabaseClient
          .from("products")
          .upsert(
            cleaned,
            {
              onConflict:
                "barcode"
            }
          );


      if (error) {
        throw error;
      }


      await loadProductsFromSupabase();


      alert(
        `Імпорт завершено. ` +
        `Оброблено продуктів: ${cleaned.length}.`
      );


    } catch (error) {

      console.error(
        "Import error:",
        error
      );


      alert(
        `Помилка імпорту: ${error.message ||
        "невідомая помилка"
        }`
      );

    }

  }


  /* ================================================= */
  /*             ESCAPE HTML                          */
  /* ================================================= */

  function escapeHTML(
    value
  ) {

    return String(
      value ?? ""
    )
      .replace(
        /&/g,
        "&amp;"
      )
      .replace(
        /</g,
        "&lt;"
      )
      .replace(
        />/g,
        "&gt;"
      )
      .replace(
        /"/g,
        "&quot;"
      )
      .replace(
        /'/g,
        "&#039;"
      );

  }


  /* ================================================= */
  /*          SUPABASE AUTH SESSION                   */
  /* ================================================= */

  try {

    const {
      data
    } =
      await supabaseClient.auth
        .getSession();


    currentUser =
      data &&
        data.session
        ? data.session.user
        : null;


  } catch (error) {

    console.error(
      "Session error:",
      error
    );


    currentUser =
      null;

  }


  /* ================================================= */
  /*              AUTH STATE LISTENER                 */
  /* ================================================= */

  supabaseClient.auth.onAuthStateChange(
    async (
      event,
      session
    ) => {

      currentUser =
        session
          ? session.user
          : null;


      if (currentUser) {

        unlockSite();


        /*
         * Не робимо зайвий запит
         * при кожній зміні стану.
         */

        if (
          event ===
          "SIGNED_IN"
        ) {

          await loadProductsFromSupabase();

        }

      } else {

        lockSite();

      }

    }
  );


  /* ================================================= */
  /*              INITIALIZATION                      */
  /* ================================================= */

  loadCalculator();

  normalizeArchive();

  renderCalculator();

  renderArchive();


  /*
   * Якщо користувач уже був
   * авторизований — відкриваємо сайт.
   *
   * Якщо ні — залишаємо тільки
   * кнопку "Увійти".
   */

  if (currentUser) {

    unlockSite();

    await loadProductsFromSupabase();

  } else {

    lockSite();

  }


});
