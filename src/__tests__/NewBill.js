/**
 * @jest-environment jsdom
 */

import { screen, fireEvent } from "@testing-library/dom";
import NewBillUI from "../views/NewBillUI.js";
import NewBill from "../containers/NewBill.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import { ROUTES, ROUTES_PATH } from "../constants/routes";
import mockStore from "../__mocks__/store.js";
import router from "../app/Router.js";

window.alert = jest.fn();
jest.mock("../app/Store", () => mockStore);

//Gestion page for the employées
describe("Given I am connected as an employee", () => {
  Object.defineProperty(window, "localStorage", { value: localStorageMock });
  window.localStorage.setItem(
    "user",
    JSON.stringify({
      type: "Employee",
    })
  );
  describe("When I am on NewBill Page", () => {
    test("Then the newbill display on screen", () => {
      //New invoice
      const html = NewBillUI();
      document.body.innerHTML = html;
      //to-do write assertion

      const data = screen.getByTestId("datepicker"); //When I dont fill in the input section for the datePicker
      expect(data.value).toBe("");

      const ttc = screen.getByTestId("amount"); //When I dont fill in the Input section TTC
      expect(ttc.value).toBe("");

      const fichierJ = screen.getByTestId("file"); //When I dont fill in the Input section attched file (ficher à joint)
      expect(fichierJ.value).toBe("");

      const formNewBill = screen.getByTestId("form-new-bill"); //Target the new form
      expect(formNewBill).toBeTruthy(); //

      const sendNewBill = jest.fn((e) => e.preventDefault()); // creation of a function to stop the default action
      formNewBill.addEventListener("submit", sendNewBill); // Event listener
      fireEvent.submit(formNewBill);
      expect(screen.getByTestId("form-new-bill")).toBeTruthy(); // Displaying the form after event
    });
  });
});
// testing the wrong file format
describe("when user uploads the attached file in the wrong format", () => {
  test("Then user stays on the newBill page and a message appears", () => {
    const html = NewBillUI();
    document.body.innerHTML = html;
    const onNavigate = (pathname) => {
      document.body.innerHTML = ROUTES({ pathname });
    };
    const newBill = new NewBill({
      document,
      onNavigate,
      store: null,
      localStorage: window,
      localStorage,
    });
    const LoadFile = jest.fn((e) => newBill.handleChangeFile(e));
    const fichier = screen.getByTestId("file");
    const testFormat = new File(["testing testing 1,2,3"], "document.txt", {
      type: "document/txt",
    });
    fichier.addEventListener("change", LoadFile);
    fireEvent.change(fichier, { target: { files: [testFormat] } });

    expect(LoadFile).toHaveBeenCalled();
    expect(window.alert).toBeTruthy();
  });
});

describe("When a user upload the attached file in the correct format", () => {
  test("Then the newBill is sent", () => {
    //here is the new bill intergrate the form path acces
    const html = NewBillUI();
    document.body.innerHTML = html;
    const onNavigate = (pathname) => {
      document.body.innerHTML = ROUTES({ pathname });
    };
    const newBill = new NewBill({
      document,
      onNavigate,
      store: mockStore,
      localStorage: window,
      localStorage,
    });
    const LoadFile = jest.fn((e) => newBill.handleChangeFile(e)); //changes the folder

    const fichier = screen.getByTestId("file"); //grabs file input
    const testFormat = new File(["testing testing 1,2,3,4"], "test.jpg", {
      type: "image/jpg",
    });
    fichier.addEventListener("change", LoadFile); // eventlistener
    fireEvent.change(fichier, { target: { files: [testFormat] } }); //

    expect(LoadFile).toHaveBeenCalled(); //checking if the files have been called
    expect(fichier.files[0]).toStrictEqual(testFormat); //making sure that the file is uploaded.

    const formNewBill = screen.getByTestId("form-new-bill"); //grabs the form
    expect(formNewBill).toBeTruthy();

    const sendNewBill = jest.fn((e) => newBill.handleSubmit(e));
    formNewBill.addEventListener("submit", sendNewBill); //submit event
    fireEvent.submit(formNewBill); //simulate the event
    expect(sendNewBill).toHaveBeenCalled();
    expect(screen.getByText("Mes notes de frais")).toBeTruthy(); //be careful with the capital letters
  });
});

//Test d'intergration POST

describe("Given I am a user connected as Employee", () => {
  describe("When I navigate to Bill page", () => {
    test("fetches New Bills from mock API", async () => {
      //mocked Login + mock API
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
      });
    });
    describe("When an error occurs on API", () => {
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
      test("fetches bills from an API and fails with 404 message error", async () => {
        mockStore.bills.mockImplementationOnce(() => {
          return {
            list: () => {
              return Promise.reject(new Error("Erreur 404"));
            },
          };
        });
        window.onNavigate(ROUTES_PATH["Bills"]);
        await new Promise(process.nextTick);
        const message = screen.getByText(/Erreur 404/);
        expect(message).toBeTruthy();
      });

      test("fetches messages from an API and fails with 500 message error", async () => {
        mockStore.bills.mockImplementationOnce(() => {
          return {
            list: () => {
              return Promise.reject(new Error("Erreur 500"));
            },
          };
        });

        window.onNavigate(ROUTES_PATH["Bills"]);
        await new Promise(process.nextTick);
        const message = screen.getByText(/Erreur 500/);
        expect(message).toBeTruthy();
      });
    });
  });
});
("");
