export default function PropertyFormFields({
  form,
  setForm,
}: {
  form: any;
  setForm: (form: any) => void;
}) {
  return (
    <>
      <div>
        <label htmlFor="title" className="label">
          Title
        </label>
        <input
          id="title"
          required
          placeholder="e.g. Spacious 2 BHK in Sector 62"
          className="input"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />
      </div>

      <div>
        <label htmlFor="description" className="label">
          Description
        </label>
        <textarea
          id="description"
          required
          placeholder="Describe the property, neighbourhood and highlights..."
          className="textarea"
          value={form.description}
          onChange={(e) =>
            setForm({ ...form, description: e.target.value })
          }
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="rent" className="label">
            Monthly rent (₹)
          </label>
          <input
            id="rent"
            required
            type="number"
            placeholder="25000"
            className="input"
            value={form.rent}
            onChange={(e) => setForm({ ...form, rent: e.target.value })}
          />
        </div>

        <div>
          <label htmlFor="property_type" className="label">
            Property type
          </label>
          <select
            id="property_type"
            required
            className="select"
            value={form.property_type}
            onChange={(e) =>
              setForm({
                ...form,
                property_type: e.target.value,
              })
            }
          >
            <option value="">Select type</option>
            <option value="Apartment">Apartment</option>
            <option value="Flat">Flat</option>
            <option value="Villa">Villa</option>
            <option value="House">House</option>
          </select>
        </div>

        <div>
          <label htmlFor="city" className="label">
            City
          </label>
          <input
            id="city"
            required
            placeholder="Noida"
            className="input"
            value={form.city}
            onChange={(e) => setForm({ ...form, city: e.target.value })}
          />
        </div>

        <div>
          <label htmlFor="location" className="label">
            Location / Sector
          </label>
          <input
            id="location"
            required
            placeholder="Sector 62"
            className="input"
            value={form.location}
            onChange={(e) =>
              setForm({ ...form, location: e.target.value })
            }
          />
        </div>

        <div>
          <label htmlFor="bedrooms" className="label">
            Bedrooms
          </label>
          <input
            id="bedrooms"
            required
            type="number"
            min={0}
            placeholder="2"
            className="input"
            value={form.bedrooms}
            onChange={(e) =>
              setForm({
                ...form,
                bedrooms: e.target.value,
              })
            }
          />
        </div>

        <div>
          <label htmlFor="bathrooms" className="label">
            Bathrooms
          </label>
          <input
            id="bathrooms"
            required
            type="number"
            min={0}
            placeholder="2"
            className="input"
            value={form.bathrooms}
            onChange={(e) =>
              setForm({
                ...form,
                bathrooms: e.target.value,
              })
            }
          />
        </div>

        <div>
          <label htmlFor="furnishing" className="label">
            Furnishing
          </label>
          <select
            id="furnishing"
            className="select"
            value={form.furnishing}
            onChange={(e) =>
              setForm({
                ...form,
                furnishing: e.target.value,
              })
            }
          >
            <option value="">Select Furnishing</option>
            <option value="Unfurnished">Unfurnished</option>
            <option value="Semi Furnished">Semi Furnished</option>
            <option value="Fully Furnished">Fully Furnished</option>
          </select>
        </div>

        <div>
          <label htmlFor="parking" className="label">
            Parking
          </label>
          <select
            id="parking"
            className="select"
            value={form.parking ? "true" : "false"}
            onChange={(e) =>
              setForm({
                ...form,
                parking: e.target.value === "true",
              })
            }
          >
            <option value="false">No Parking</option>
            <option value="true">Parking Available</option>
          </select>
        </div>

        <div>
          <label htmlFor="available_from" className="label">
            Available from
          </label>
          <input
            id="available_from"
            type="date"
            className="input"
            value={form.available_from}
            onChange={(e) =>
              setForm({
                ...form,
                available_from: e.target.value,
              })
            }
          />
        </div>

        <div>
          <label htmlFor="contact_number" className="label">
            Contact number
          </label>
          <input
            id="contact_number"
            placeholder="Optional reference contact"
            className="input"
            value={form.contact_number}
            onChange={(e) =>
              setForm({
                ...form,
                contact_number: e.target.value,
              })
            }
          />
        </div>
      </div>
    </>
  );
}
