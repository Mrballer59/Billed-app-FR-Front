/**
 * @jest-environment jsdom
 */

import { screen, waitFor, fireEvent } from "@testing-library/dom";
import BillsUI from "../views/BillsUI.js";
import { bills } from "../fixtures/bills.js";
import { ROUTES, ROUTES_PATH } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import Bills from "../containers/Bills.js";
import mockStore from "../__mocks__/store";
import router from "../app/Router.js";
import NewBillUI from "../views/NewBillUI.js";

jest.mock("../app/Store", () => mockStore);
// test page employée for the receipt
describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
        })
      );
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
      window.onNavigate(ROUTES_PATH.Bills);
      await waitFor(() => screen.getByTestId("icon-window"));
      const windowIcon = screen.getByTestId("icon-window");
      //to-do write expect expression
      //added mention as asked in the kanban
      expect(windowIcon.classList.contains("active-icon")).toBe(true); // This has to be true instead of false.
    });

    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills });
      const dates = screen
        .getAllByText(
          /^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i
        )
        .map((a) => a.innerHTML);
      const antiChrono = (a, b) => (a < b ? 1 : -1);
      const datesSorted = [...dates].sort(antiChrono);
      expect(dates).toEqual(datesSorted);
    });
  });
});

//This part is test handleClickIconEye ligne 14 containers/Bills.js
describe("when a user clicks on the eye icon", () => {
  test("Then modal should open", () => {
    // the test the shows the click on the Eye Icon
    Object.defineProperty(window, localStorage, { value: localStorageMock });
    window.localStorage.setItem("user", JSON.stringify({ type: "Employee" }));
    const html = BillsUI({ data: bills });
    document.body.innerHTML = html;

    const onNavigate = (pathname) => {
      //navigation of the bills
      document.body.innerHTML = ROUTES({ pathname });
    };
    const billsContainer = new Bills({
      document,
      onNavigate,
      localStorage: localStorageMock,
      store: null,
    });

    //Mocked Modal the fn stands for function
    $.fn.modal = jest.fn();
    //Mocked the clickHandle icon

    const handleClickIconEye = jest.fn(() => {
      billsContainer.handleClickIconEye;
    });
    const firstEyeIcon = screen.getAllByTestId("icon-eye")[0];
    firstEyeIcon.addEventListener("click", handleClickIconEye);
    fireEvent.click(firstEyeIcon);
    expect(handleClickIconEye).toHaveBeenCalled();
    expect($.fn.modal).toHaveBeenCalled();
  });
});

// test naviagtion ligne 21 containers/Bills.js
describe("When a user click the button 'Nouvelle note de frais'", () => {
  test("Then newbill appears", () => {
    // Path to acces new bill
    const onNavigate = (pathname) => {
      document.body.innerHTML = ROUTES({ pathname });
    };
    const billsPage = new Bills({
      document,
      onNavigate,
      store: null,
      bills: bills,
      localStorage: window.localStorage,
    });
    //test function
    const OpenNewBill = jest.fn(billsPage.handleClickNewBill);
    //Bills.js line20
    const btnNewBill = screen.getByTestId("btn-new-bill"); //new button
    btnNewBill.addEventListener("click", OpenNewBill); //event listener
    fireEvent.click(btnNewBill);
    // we check if the function is called when expected
    expect(OpenNewBill).toHaveBeenCalled();
    expect(screen.getByText("Envoyer une note de frais")).toBeTruthy(); // new note de frais
  });
});

// test const bills ligne 37-57 containers/Bills.js
describe("When I get bills", () => {
  test("Then it should render bills", async () => {
    const bills = new Bills({
      document,
      onNavigate,
      store: mockStore,
      localStorage: window.localStorage,
    });
    const getBills = jest.fn(() => bills.getBills()); //mocked Bills
    const value = await getBills();
    expect(getBills).toHaveBeenCalled(); //checking of the method is called
    expect(value.length).toBe(4); //checking the title of bills
  });
});
// Test Erreur 404 et 500

describe("when a error occurs with the API", () => {
  beforeEach(() => {
    jest.spyOn(mockStore, "bills");
    Object.defineProperty(window, "localStorage", {
      value: localStorageMock,
    });
    window.localStorage.setItem(
      "user",
      JSON.stringify({
        type: "Employee",
        email: "a@a",
      })
    );
    const root = document.createElement("div");
    root.setAttribute("id", "root");
    document.body.appendChild(root);
    router();
  });
  test("Then fetches the invoice to the API, it fails with a error code 404 error", async () => {
    mockStore.bills.mockImplementationOnce(() => {
      // mock bills in the store.js
      return {
        list: () => {
          return Promise.reject(new Error("Error 404"));
        },
      };
    });
    window.onNavigate(ROUTES_PATH.Bills);
    await new Promise(process.nextTick);
    const message = screen.getByText(/Error 404/);
    expect(message).toBeTruthy();
  });

  test("Then fetches the invoice in to the API and it fails with a 500 code error", async () => {
    mockStore.bills.mockImplementationOnce(() => {
      return {
        list: () => {
          return Promise.reject(new Error("Error 500"));
        },
      };
    });
    window.onNavigate(ROUTES_PATH.Bills);
    await new Promise(process.nextTick);
    const message = screen.getByText(/Error 500/);
    expect(message).toBeTruthy();
  });
});
